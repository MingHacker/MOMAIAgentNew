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
  Image,
} from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { getTaskSuggestionsFromBackend } from '../services/hooks/useTaskSuggestion';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import axiosInstance from '../utils/axiosInstance';
import { DateTime } from 'luxon';
import { MaterialCommunityIcons } from '@expo/vector-icons';


// 子任务类型
interface TaskUpdate {
  id: string;
  done: Boolean;
}

// ✅ 提交任务状态更新 API
export const updateTaskStatus = async (
  mainTaskId: string,
  subTasks: TaskUpdate[],
  done: boolean
) => {
  try {
    const mainTaskUpdate: TaskUpdate = {
      id: mainTaskId,
      done: done
    }

    // const subs: TaskUpdate[] = []

    // for(const sub of subTasks)
    // {
    //   subs.push({id: sub.id, done: sub.done})
    // }

    const res = await axiosInstance.post('/api/task/update', {
      main_task: mainTaskUpdate,
      sub_tasks: subTasks,
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
  title: string;
  description: string;
  created_at: string;
  completed: boolean;
}

// "建议子任务"的结构（包括是否被选中）
interface SuggestedItem {
  text: string;
  selected: boolean;
}

const generateUniqueId = () => {
  return uuidv4();
};

export default function TaskManagerScreen() {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSubTaskModalVisible, setSubTaskModalVisible] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [subTaskText, setSubTaskText] = useState('');
  const [subTaskSuggestions, setSubTaskSuggestions] = useState<SuggestedItem[]>([]);
  const [confirmClearVisible, setConfirmClearVisible] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isAdding, setIsAdding] = useState(false);


  const getSuggestionsAndCategory = async (mainTaskText: string) => {
    const { category, suggestions } = await getTaskSuggestionsFromBackend(mainTaskText);
    return { category, suggestions };
  };

  const addTask = async () => {
    if (!taskText.trim() || isAdding) return;
    
    setIsAdding(true);
    try {
      const { category, suggestions } = await getSuggestionsAndCategory(taskText);

      const newTask: Task = {
        id: generateUniqueId(),
        text: taskText,
        type: category || 'Other',
        done: false,
        subTasks: [],
        title: taskText,
        description: '',
        created_at: DateTime.now().toISO()!,
        completed: false,
      };

      // 先保存主任务
      await submitTaskToBackend(newTask);

      setTasks(prevTasks => [newTask, ...prevTasks]);
      setSubTaskSuggestions(suggestions || []);
      setCurrentTaskId(newTask.id);
      setSubTaskModalVisible(true);
      setTaskText('');
      setSubTaskText('');
    } catch (error) {
      console.error('添加任务失败:', error);
      // 即使获取建议失败，也添加任务
      const newTask: Task = {
        id: generateUniqueId(),
        text: taskText,
        type: 'Other',
        done: false,
        subTasks: [],
        title: taskText,
        description: '',
        created_at: DateTime.now().toISO()!,
        completed: false,
      };

      setTasks(prevTasks => [newTask, ...prevTasks]);
      setTaskText('');
      setSubTaskText('');
    } finally {
      setIsAdding(false);
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const openSubTaskModal = (taskId: string) => {
    setCurrentTaskId(taskId);
    setSubTaskText('');
    // 重置所有建议的选中状态
    setSubTaskSuggestions(prev => prev.map(item => ({ ...item, selected: false })));
    setSubTaskModalVisible(true);
  };

  const toggleSuggestionSelected = (index: number) => {
    setSubTaskSuggestions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const submitTaskToBackend = async (task: Task) => {
    try {
      // 准备发送到后端的数据
      const taskData = {
        main_task: {
          id: task.id,
          text: task.text,
          type: task.type || 'Other',
          done: task.done,
          title: task.title || task.text,
          description: task.description || '',
          created_at: task.created_at,
          completed: task.completed
        },
        sub_tasks: task.subTasks.map(subTask => ({
          id: subTask.id,
          text: subTask.text,
          done: subTask.done,
          main_task_id: task.id
        }))
      };

      console.log('Saving task to backend:', JSON.stringify(taskData, null, 2));
      
      const result = await axiosInstance.post('/api/task/save', taskData);
      
      if (result.data && result.data.success) {
        console.log('✅ Task saved successfully:', result.data);
      } else {
        console.error('❌ Failed to save task:', result.data);
        throw new Error(result.data?.message || 'Failed to save task');
      }
    } catch (error: any) {
      console.error('❌ Error saving task:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  };

  const addSubTask = async () => {
    if (!currentTaskId) return;
    const newSubTasks: SubTask[] = [];

    if (subTaskText.trim()) {
      newSubTasks.push({ id: generateUniqueId(), text: subTaskText.trim(), done: false });
    }

    const selectedSuggestions = subTaskSuggestions.filter((s) => s.selected);
    selectedSuggestions.forEach((sug) => {
      newSubTasks.push({ id: generateUniqueId(), text: sug.text, done: false });
    });

    const updatedTasks = tasks.map((task) =>
      task.id === currentTaskId
        ? { ...task, subTasks: [...task.subTasks, ...newSubTasks] }
        : task
    );
    setTasks(updatedTasks);
    setSubTaskModalVisible(false);
    setSubTaskText('');
    setSubTaskSuggestions(prev => prev.map(item => ({ ...item, selected: false })));

    const currentTask = updatedTasks.find((t) => t.id === currentTaskId);
    if (currentTask) {
      try {
        await submitTaskToBackend(currentTask);
      } catch (error) {
        console.error('Failed to save task with subtasks:', error);
        // 可以在这里添加错误提示UI
      }
    }
  };

  const toggleDone = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const updated = { ...task, done: !task.done };
          updateTaskStatus(updated.id, updated.subTasks, updated.done);
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
          updateTaskStatus(taskId, updatedSubs, task.done);
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
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    );
  };
  const renderCategoryCard = (
    label: string,
    type: Task['type'],
    color: string
  ) => {
    const count = tasks.filter((task) => task.type === type).length;
    const imageSource = {
      'Health': require('../assets/Health.png'),
      'Family': require('../assets/Family.png'),
      'Baby': require('../assets/Baby.png'),
      'Other': require('../assets/Other.png')
    }[type];

    return (
      <View style={[styles.card, { backgroundColor: color }]}>
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Image source={imageSource} style={styles.categoryImage} />
            <Text style={styles.cardLabel}>{label}</Text>
          </View>
          <Text style={styles.cardCount}>{count}</Text>
        </View>
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
    <View style={styles.rootContainer}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={styles.container}>
            {/* 这块如果你需要分类卡片，也可再写renderCategoryCard之类的 */}
            <View style={styles.cardRow}>
              {renderCategoryCard('Health', 'Health', '#E0F2F1')}
              {renderCategoryCard('Family', 'Family', '#F3E5F5')}
              {renderCategoryCard('Baby', 'Baby', '#FEF3C7')}
              {renderCategoryCard('Other', 'Other', '#EDE9FE')}
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
                  <Text style={styles.modalTitle}>Confirm Clear</Text>
                  <Text style={{ marginBottom: 16 }}>Are you sure you want to delete all completed tasks? This action cannot be undone.</Text>

                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                      onPress={() => setConfirmClearVisible(false)}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                      onPress={() => {
                        clearCompletedTasks();
                        setConfirmClearVisible(false);
                      }}
                    >
                      <Text style={styles.modalButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* 底部输入栏：添加主任务 */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Add Main Task..."
                value={taskText}
                onChangeText={setTaskText}
                editable={!isAdding}
              />
              <TouchableOpacity 
                style={[styles.addButton, isAdding && styles.addButtonDisabled]} 
                onPress={addTask}
                disabled={isAdding}
              >
                <Text style={styles.addText}>{isAdding ? 'Adding...' : 'Add'}</Text>
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
                  <Text style={styles.modalTitle}>Add Sub Task</Text>

                  {/* 1) DeepSeek Suggested Sub Tasks */}
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

                  {/* 2) Manual Input Sub Task */}
                  <TextInput
                    style={styles.subTaskInput}
                    placeholder="Or enter sub task here..."
                    value={subTaskText}
                    onChangeText={setSubTaskText}
                  />

                  {/* Button Row */}
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                      onPress={() => setSubTaskModalVisible(false)}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                      onPress={addSubTask}
                    >
                      <Text style={styles.modalButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ==================== 样式 ====================
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
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
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  cardLabel: {
    fontSize: 14,
    color: '#555',
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
    backgroundColor: '#C4B5FD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#E5E7EB',
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
  // DeepSeek Suggested Sub Tasks Area
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
  // Custom Input Sub Task
  subTaskInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  // Modal Button Row
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
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'contain',
  },
});
