import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import Swipeable from 'react-native-gesture-handler/Swipeable';

// 从.env 中读取DeepSeek的KEY
import { DEEPSEEK_API_KEY } from '@env';

// 子任务类型
interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

// 任务类型
interface Task {
  id: string;
  text: string;
  type: '健康' | '家庭' | '心理' | '其他';
  done: boolean;
  subTasks: SubTask[];
}

// “建议子任务”的结构（包括是否被选中）
interface SuggestedItem {
  text: string;
  selected: boolean;
}

export default function TaskManagerScreen() {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  // 子任务弹窗相关的状态
  const [isSubTaskModalVisible, setSubTaskModalVisible] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // 用来**手动输入**子任务的输入框
  const [subTaskText, setSubTaskText] = useState('');

  // DeepSeek返回的子任务建议
  const [subTaskSuggestions, setSubTaskSuggestions] = useState<SuggestedItem[]>(
    []
  );

  // ================== 核心：获取 DeepSeek 建议子任务 ===================
  const getSubTaskSuggestionsFromAI = async (mainTaskText: string) => {
    try {
      const prompt = `给我一个与“${mainTaskText}”相关的简短子任务列表，5条即可,每一条控制在4字内。请只返回 JSON 数组格式的纯文本，每一条是一个字符串，如：["子任务1","子任务2","子任务3","子任务4","子任务5"]`;
      const res = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
        }
      );

      // res.data.choices[0].message.content 里应当是个 JSON 数组字符串
      const content = res.data.choices[0].message.content.trim();
      // 解析JSON
      const suggestionArray = JSON.parse(content) as string[];
      // 转换成 { text, selected } 结构
      const suggestions: SuggestedItem[] = suggestionArray.map((text) => ({
        text,
        selected: false,
      }));

      return suggestions;
    } catch (error) {
      console.error('获取子任务建议出错:', error);
      return [];
    }
  };

  // ============== 获取分类(你已有的逻辑，这里放简单示例) ==============
  const getCategoryFromAI = async (text: string): Promise<Task['type']> => {
    try {
      const res = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: `把这个任务分类为「健康」「心理」「家庭」「其他」中的一种：${text}，只返回一个词。`,
            },
          ],
          temperature: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
        }
      );
      const answer = res.data.choices[0].message.content.trim();
      if (['健康', '心理', '家庭', '其他'].includes(answer)) {
        return answer as Task['type'];
      }
    } catch (error) {
      console.error('GPT 分类出错', error);
    }
    return '其他';
  };

  // ================== 添加主任务 ===================
  const addTask = async () => {
    if (!taskText.trim()) return;
    const category = await getCategoryFromAI(taskText);
    const newTask: Task = {
      id: Date.now().toString(),
      text: taskText,
      type: category,
      done: false,
      subTasks: [],
    };
    setTasks([newTask, ...tasks]);
    setTaskText('');
  };

  // ================== 左滑删除主任务(省略Swipeable细节) ===================
  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // ================== 打开“添加子任务”弹窗 ===================
  const openSubTaskModal = async (taskId: string) => {
    setCurrentTaskId(taskId);
    setSubTaskText('');

    // 根据主任务文本获取子任务建议
    const theTask = tasks.find((t) => t.id === taskId);
    if (!theTask) {
      setSubTaskSuggestions([]);
      setSubTaskModalVisible(true);
      return;
    }
    const suggestions = await getSubTaskSuggestionsFromAI(theTask.text);
    setSubTaskSuggestions(suggestions);
    setSubTaskModalVisible(true);
  };

  // =========== 在弹窗里，点击气泡 => toggle选中状态 ===========
  const toggleSuggestionSelected = (index: number) => {
    setSubTaskSuggestions((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // =========== 确认添加子任务 ===========
  const addSubTask = () => {
    if (!currentTaskId) return;

    // 1) 用户可能手动输入了1条子任务
    const newSubTasks: SubTask[] = [];
    if (subTaskText.trim()) {
      newSubTasks.push({
        id: Date.now().toString(),
        text: subTaskText.trim(),
        done: false,
      });
    }

    // 2) 用户在建议列表里选了的子任务
    const selectedSuggestions = subTaskSuggestions.filter((s) => s.selected);
    selectedSuggestions.forEach((sug) => {
      newSubTasks.push({
        id: Date.now().toString(),
        text: sug.text,
        done: false,
      });
    });

    // 3) 将这些新子任务更新到对应的主任务里
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === currentTaskId) {
          return {
            ...task,
            subTasks: [...task.subTasks, ...newSubTasks],
          };
        }
        return task;
      })
    );

    // 4) 关闭弹窗
    setSubTaskModalVisible(false);
  };

  // ================== 主任务和子任务的展示逻辑 ===================
  const toggleDone = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  const toggleSubTaskDone = (taskId: string, subTaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            subTasks: task.subTasks.map((st) =>
              st.id === subTaskId ? { ...st, done: !st.done } : st
            ),
          };
        }
        return task;
      })
    );
  };

  // 左滑时显示的删除按钮(示例)
  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTask(id)}>
        <Text style={styles.deleteButtonText}>删除</Text>
      </TouchableOpacity>
    );
  };
  const renderCategoryCard = (
    label: string,
    type: Task['type'],
    color: string
  ) => {
    const count = tasks.filter((task) => task.type === type).length;
    return (
      <View style={[styles.card, { backgroundColor: color }]}>
        <Text style={styles.cardCount}>{count}</Text>
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
    );
  };

  // 渲染每个主任务
  const renderTask = ({ item }: { item: Task }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <View style={[styles.taskItem, item.done && styles.taskDone]}>
        {/* 第一行：主任务 Checkbox + 文本 + "＋"按钮 */}
        <View style={styles.mainTaskRow}>
          <TouchableOpacity style={styles.checkbox} onPress={() => toggleDone(item.id)}>
            {item.done && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.taskText, item.done && styles.taskTextDone]}>
              {item.text}
            </Text>
            <Text style={styles.tag}>{item.type}</Text>
          </View>
          <TouchableOpacity style={styles.plusButton} onPress={() => openSubTaskModal(item.id)}>
            <Text style={styles.plusText}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* 第二行：子任务列表 */}
        <View style={styles.subTaskContainer}>
          {item.subTasks.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              onPress={() => toggleSubTaskDone(item.id, sub.id)}
              style={styles.subTaskItem}
            >
              <View style={styles.checkbox}>
                {sub.done && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.subTaskText, sub.done && styles.taskTextDone]}>
                {sub.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Swipeable>
  );

  // ================== UI 渲染 ===================
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Text style={styles.title}>📋 Task</Text>

          {/* 这块如果你需要分类卡片，也可再写renderCategoryCard之类的 */}
          <View style={styles.cardRow}>
            {renderCategoryCard('健康', '健康', '#E8EAF6')}
            {renderCategoryCard('家庭', '家庭', '#E0F2F1')}
            {renderCategoryCard('心理', '心理', '#F3E5F5')}
            {renderCategoryCard('其他', '其他', '#ECEFF1')}
          </View> 

          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
          />

          {/* 底部输入栏：添加主任务 */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="添加主任务..."
              value={taskText}
              onChangeText={setTaskText}
            />
            <TouchableOpacity style={styles.addButton} onPress={addTask}>
              <Text style={styles.addText}>添加</Text>
            </TouchableOpacity>
          </View>

          {/* Modal：添加子任务 */}
          <Modal
            visible={isSubTaskModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setSubTaskModalVisible(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>添加子任务</Text>

                {/* 1) DeepSeek 建议子任务 */}
                <View style={styles.suggestionContainer}>
                  {subTaskSuggestions.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.suggestionBubble,
                        item.selected && styles.suggestionBubbleSelected,
                      ]}
                      onPress={() => toggleSuggestionSelected(index)}
                    >
                      <Text>{item.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 2) 手动输入子任务 */}
                <TextInput
                  style={styles.subTaskInput}
                  placeholder="或在此输入子任务..."
                  value={subTaskText}
                  onChangeText={setSubTaskText}
                />

                {/* 按钮行 */}
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                    onPress={() => setSubTaskModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                    onPress={addSubTask}
                  >
                    <Text style={styles.modalButtonText}>确认</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==================== 样式 ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  // ============ 主任务部分 ============
  taskItem: {
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardLabel: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  
  taskDone: {
    backgroundColor: '#E0F7FA',
  },
  mainTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#888',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
  },
  taskText: {
    fontSize: 16,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  tag: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
    backgroundColor: '#eee',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  plusButton: {
    marginLeft: 10,
    backgroundColor: '#2196F3',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 22,
  },
  subTaskContainer: {
    marginTop: 8,
    marginLeft: 36,
  },
  subTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  subTaskText: {
    fontSize: 14,
  },
  // ============ 底部添加主任务输入 ============
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // ============ 左滑删除 ============
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
    marginLeft: -10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // ============ Modal 添加子任务 ============
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  // DeepSeek 建议子任务区域
  suggestionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  suggestionBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionBubbleSelected: {
    backgroundColor: '#ADD8E6',
  },
  // 自定义输入子任务
  subTaskInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  // 弹窗按钮行
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
