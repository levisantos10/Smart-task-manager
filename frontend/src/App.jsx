import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle } from 'lucide-react';

// Imports dos componentes (ajuste os caminhos conforme sua estrutura)
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import { StatsGrid } from './components/StatsGrid';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';

const API_BASE_URL = 'http://localhost:8000';

const TaskManager = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, in_progress: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending'
  });

  // API functions
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/stats`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const login = async (loginData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', loginData.username);
      formData.append('password', loginData.password);

      const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setUser({ username: loginData.username });
        fetchTasks();
        fetchStats();
      } else {
        alert('Credenciais inválidas');
      }
    } catch (error) {
      alert('Erro ao fazer login');
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setTasks([]);
    setStats({ total: 0, completed: 0, pending: 0, in_progress: 0 });
  };

  const createTask = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskForm),
      });

      if (response.ok) {
        fetchTasks();
        fetchStats();
        closeModal();
      }
    } catch (error) {
      alert('Erro ao criar tarefa');
    }
    setLoading(false);
  };

  const updateTask = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskForm),
      });

      if (response.ok) {
        fetchTasks();
        fetchStats();
        closeModal();
      }
    } catch (error) {
      alert('Erro ao atualizar tarefa');
    }
    setLoading(false);
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          fetchTasks();
          fetchStats();
        }
      } catch (error) {
        alert('Erro ao excluir tarefa');
      }
    }
  };

  const quickUpdateStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
        fetchStats();
      }
    } catch (error) {
      alert('Erro ao atualizar status');
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: 'medium',
      status: task.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setTaskForm({ title: '', description: '', priority: 'medium', status: 'pending' });
  };

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/protected`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      .then(response => {
        if (response.ok) {
          setUser({ username: 'User' });
          fetchTasks();
          fetchStats();
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  // Se não estiver logado, mostra tela de login
  if (!user) {
    return <LoginScreen onLogin={login} loading={loading} />;
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={logout} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StatsGrid stats={stats} />

        {/* Tasks Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Suas Tarefas</h2>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Tarefa</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Nenhuma tarefa encontrada</p>
                <p className="text-sm text-gray-400 mt-1">Clique em "Nova Tarefa" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEditModal}
                    onDelete={deleteTask}
                    onStatusChange={quickUpdateStatus}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskModal
        show={showModal}
        editingTask={editingTask}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        onSave={editingTask ? updateTask : createTask}
        onClose={closeModal}
        loading={loading}
      />
    </div>
  );
};

export default TaskManager;

//falta ajustes
   