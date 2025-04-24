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
import { v4 as uuidv4 } from 'uuid';
import { getTaskSuggestionsFromBackend } from '../services/hooks/useTaskSuggestion';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import axiosInstance from '../utils/axiosInstance';


// ✅ 提交任务状态更新 API
export const updateTaskStatus = async (
  mainTaskText: string,
  subTasks: { text: string; done: boolean }[],
  done: boolean
) => {
  try {
    const res = await axiosInstance.post('/api/task/update', {
      main_task: mainTaskText,
      sub_tasks: subTasks,
      done,
    });
    console.log('✅ 状态更新成功:', res.data);
    return res.data;
  } catch (err) {
    console.error('❌ 状态更新失败:', err);
    throw err;
  }
};

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
  type: 'Health' | 'Family' | 'Baby' | 'Other';
  done: boolean;
  subTasks: SubTask[];
}

// "建议子任务"的结构（包括是否被选中）
interface SuggestedItem {
  text: string;
  selected: boolean;
}

export default function TaskManagerScreen() {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSubTaskModalVisible, setSubTaskModalVisible] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [subTaskText, setSubTaskText] = useState('');
  const [subTaskSuggestions, setSubTaskSuggestions] = useState<SuggestedItem[]>([]);
  const [confirmClearVisible, setConfirmClearVisible] = useState(false);


  const getSuggestionsAndCategory = async (mainTaskText: string) => {
    const { category, suggestions } = await getTaskSuggestionsFromBackend(mainTaskText);
    return { category, suggestions };
  };

  const addTask = async () => {
    if (!taskText.trim()) return;
    
    try {
      const { category, suggestions } = await getSuggestionsAndCategory(taskText);

      const newTask: Task = {
        id: Date.now().toString(),
        text: taskText,
        type: category,
        done: false,
        subTasks: [],
      };

      setTasks([newTask, ...tasks]);
      setSubTaskSuggestions(suggestions);
      setCurrentTaskId(newTask.id);
      setSubTaskModalVisible(true);
      setTaskText('');
    } catch (error) {
      console.error('添加任务失败:', error);
      // 即使获取建议失败，也添加任务
      const newTask: Task = {
        id: Date.now().toString(),
        text: taskText,
        type: 'Other',
        done: false,
        subTasks: [],
      };
      setTasks([newTask, ...tasks]);
      setTaskText('');
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const openSubTaskModal = (taskId: string) => {
    setCurrentTaskId(taskId);
    setSubTaskText('');
    setSubTaskModalVisible(true);
  };

  const toggleSuggestionSelected = (index: number) => {
    setSubTaskSuggestions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const submitTaskToBackend = async (task: Task) => {
    try {
      const result = await axiosInstance.post('/api/task/save', {
        main_task: task.text,
        sub_tasks: task.subTasks.map((sub) => ({ text: sub.text })),
      });
      console.log('✅ 已成功保存任务与子任务');
      console.log(result)
    } catch (err) {
      console.error('❌ 保存任务失败:', err);
    }
  };

  const addSubTask = async () => {
    if (!currentTaskId) return;
    const newSubTasks: SubTask[] = [];

    if (subTaskText.trim()) {
      newSubTasks.push({ id: uuidv4(), text: subTaskText.trim(), done: false });
    }

    const selectedSuggestions = subTaskSuggestions.filter((s) => s.selected);
    selectedSuggestions.forEach((sug) => {
      newSubTasks.push({ id: uuidv4(), text: sug.text, done: false });
    });

    const updatedTasks = tasks.map((task) =>
      task.id === currentTaskId
        ? { ...task, subTasks: [...task.subTasks, ...newSubTasks] }
        : task
    );
    setTasks(updatedTasks);
    setSubTaskModalVisible(false);

    const currentTask = updatedTasks.find((t) => t.id === currentTaskId);
    if (currentTask) {
      await submitTaskToBackend(currentTask);
    }
  };

  const toggleDone = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const updated = { ...task, done: !task.done };
          updateTaskStatus(updated.text, updated.subTasks, updated.done);
          return updated;
        }
        return task;
      })
    );
  };

  const toggleSubTaskDone = (taskId: string, subTaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedSubs = task.subTasks.map((st) =>
            st.id === subTaskId ? { ...st, done: !st.done } : st
          );
          updateTaskStatus(task.text, updatedSubs, task.done); // ✅ 自动触发更新
          return { ...task, subTasks: updatedSubs };
        }
        return task;
      })
    );
  };

  // 清除任务
  const clearCompletedTasks = () => {
    const filtered = tasks
      .filter((task) => !task.done)
      .map((task) => ({
        ...task,
        subTasks: task.subTasks.filter((sub) => !sub.done),
      }));
    setTasks(filtered);
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.container}>

          {/* 这块如果你需要分类卡片，也可再写renderCategoryCard之类的 */}
          <View style={styles.cardRow}>
            {renderCategoryCard('健康', 'Health', '#E8EAF6')}
            {renderCategoryCard('家庭', 'Family', '#E0F2F1')}
            {renderCategoryCard('心理', 'Baby', '#F3E5F5')}
            {renderCategoryCard('其他', 'Other', '#ECEFF1')}
          </View> 

          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
          />

          <TouchableOpacity style={styles.fabButton} onPress={() => setConfirmClearVisible(true)}>
            <Text style={styles.fabText}>-</Text>
          </TouchableOpacity>

          <Modal
            visible={confirmClearVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setConfirmClearVisible(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>确认清除</Text>
                <Text style={{ marginBottom: 16 }}>确定要删除所有已完成任务吗？此操作不可撤销。</Text>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                    onPress={() => setConfirmClearVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                    onPress={() => {
                      clearCompletedTasks();
                      setConfirmClearVisible(false);
                    }}
                  >
                    <Text style={styles.modalButtonText}>确认</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },

  fabButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#bfb2d4',
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 20,
    color: '#7C3AED',
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
    marginTop: 20,
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
    paddingBottom: 20,
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
