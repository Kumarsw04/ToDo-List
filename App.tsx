
import React, {useCallback, useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

// Task data type
type Task = {
  id: string;
  title: string;
  completed: boolean;
};

// Android Emulator -> Express Backend
const API_URL = 'http://localhost:5000/api';

// Temporary test user identification
const TEST_USER_ID = 'user-android-01';

const API_HEADERS = {
  'Content-Type': 'application/json',
  'x-test-user-id': TEST_USER_ID,
  'x-client-source': 'android',
};

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  // GET: Load tasks from Express + InfluxDB
  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'GET',
        headers: API_HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status}`);
      }

      const data: Task[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid task response');
      }

      setTasks(data);
    } catch (error) {
      console.error('Load tasks error:', error);
      Alert.alert(
        'Connection Error',
        'Could not load tasks from the backend. Check that Express is running.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tasks when the app opens
  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  // Refresh task list manually
  const refreshTasks = async () => {
    setRefreshing(true);

    try {
      await loadTasks();
    } finally {
      setRefreshing(false);
    }
  };

  // POST: Create a task
  const addTask = async () => {
    const title = task.trim();

    if (!title || saving) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({title}),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.status}`);
      }

      setTask('');
      await loadTasks();
    } catch (error) {
      console.error('Create task error:', error);
      Alert.alert('Error', 'Could not save the task.');
    } finally {
      setSaving(false);
    }
  };

  // PATCH: Complete or reopen a task
  const toggleTask = async (id: string) => {
    if (busyTaskId !== null) {
      return;
    }

    const existing = tasks.find(item => item.id === id);

    if (!existing) {
      return;
    }

    try {
      setBusyTaskId(id);

      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: API_HEADERS,
        body: JSON.stringify({
          completed: !existing.completed,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status}`);
      }

      await loadTasks();
    } catch (error) {
      console.error('Update task error:', error);
      Alert.alert('Error', 'Could not update the task.');
    } finally {
      setBusyTaskId(null);
    }
  };

  // DELETE: Record task deletion in InfluxDB
  const deleteTask = async (id: string) => {
    if (busyTaskId !== null) {
      return;
    }

    try {
      setBusyTaskId(id);

      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: API_HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status}`);
      }

      await loadTasks();
    } catch (error) {
      console.error('Delete task error:', error);
      Alert.alert('Error', 'Could not delete the task.');
    } finally {
      setBusyTaskId(null);
    }
  };

  // Calculate progress
  const completedCount = tasks.filter(
    item => item.completed,
  ).length;

  const progress = tasks.length > 0
    ? (completedCount / tasks.length) * 100
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.heading}>My Tasks</Text>

        <Text style={styles.subtitle}>
          Organize your day, one task at a time.
        </Text>

        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>
            Your daily progress
          </Text>

          <Text style={styles.progressCount}>
            {completedCount} of {tasks.length} completed
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {width: `${progress}%`},
              ]}
            />
          </View>
        </View>

        {/* Add task */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter a new task..."
            placeholderTextColor="#98A2B3"
            value={task}
            onChangeText={setTask}
            onSubmitEditing={() => void addTask()}
            returnKeyType="done"
            editable={!saving}
          />

          <TouchableOpacity
            style={styles.addButton}
            disabled={saving}
            onPress={() => void addTask()}>
            <Text style={styles.addButtonText}>
              {saving ? '...' : '+'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Task list */}
        <Text style={styles.sectionTitle}>
          Your Tasks
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void refreshTasks()}
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No tasks yet. Add your first task!
              </Text>
            }
            renderItem={({item}) => (
              <View style={styles.taskCard}>
                <TouchableOpacity
                  style={styles.taskInfo}
                  disabled={busyTaskId !== null}
                  onPress={() => void toggleTask(item.id)}>
                  <Text style={styles.checkbox}>
                    {item.completed ? '☑' : '☐'}
                  </Text>

                  <Text
                    style={[
                      styles.taskText,
                      item.completed && styles.completedText,
                    ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  disabled={busyTaskId !== null}
                  onPress={() => void deleteTask(item.id)}>
                  {busyTaskId === item.id ? (
                    <ActivityIndicator
                      size="small"
                      color="#EF4444"
                    />
                  ) : (
                    <Text style={styles.deleteText}>
                      Delete
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Original design preserved
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#18233D',
  },
  subtitle: {
    fontSize: 14,
    color: '#667085',
    marginTop: 6,
    marginBottom: 24,
  },
  progressCard: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  progressCount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#93B4F9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 28,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#18233D',
    fontSize: 15,
  },
  addButton: {
    backgroundColor: '#2563EB',
    width: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18233D',
    marginBottom: 14,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E1E5EE',
  },
  taskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    fontSize: 25,
    color: '#2563EB',
    marginRight: 12,
  },
  taskText: {
    fontSize: 15,
    color: '#18233D',
    flexShrink: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#98A2B3',
  },
  deleteButton: {
    marginLeft: 12,
    paddingVertical: 8,
  },
  deleteText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#98A2B3',
    marginTop: 40,
  },
});
