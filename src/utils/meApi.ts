const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const meApi = {
  // --- Overview ---
  getOverview: async () => {
    const res = await fetch(`${API_BASE}/me/overview`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch overview');
    return res.json();
  },

  // --- Finance ---
  getExpenses: async (params?: { category?: string; paymentMethod?: string; startDate?: string; endDate?: string; sort?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/me/finance/expenses?${query}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },
  createExpense: async (data: any) => {
    const res = await fetch(`${API_BASE}/me/finance/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create expense');
    }
    return res.json();
  },
  updateExpense: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/me/finance/expenses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
  },
  deleteExpense: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/finance/expenses/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
  },

  getIncome: async () => {
    const res = await fetch(`${API_BASE}/me/finance/income`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch income');
    return res.json();
  },
  createIncome: async (data: any) => {
    const res = await fetch(`${API_BASE}/me/finance/income`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create income');
    }
    return res.json();
  },
  deleteIncome: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/finance/income/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete income');
    return res.json();
  },

  getBudgets: async (month?: string) => {
    const q = month ? `?month=${month}` : '';
    const res = await fetch(`${API_BASE}/me/finance/budgets${q}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return res.json();
  },
  saveBudget: async (data: { category: string; monthlyLimit: number; month?: string }) => {
    const res = await fetch(`${API_BASE}/me/finance/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save budget');
    return res.json();
  },
  deleteBudget: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/finance/budgets/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete budget');
    return res.json();
  },

  getGoals: async () => {
    const res = await fetch(`${API_BASE}/me/finance/goals`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },
  createGoal: async (data: any) => {
    const res = await fetch(`${API_BASE}/me/finance/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create goal');
    return res.json();
  },
  contributeGoal: async (id: string, data: { amount: number; note?: string; date?: string }) => {
    const res = await fetch(`${API_BASE}/me/finance/goals/${id}/contribute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to contribute to goal');
    return res.json();
  },
  deleteGoal: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/finance/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete goal');
    return res.json();
  },

  // --- Health ---
  getWeight: async () => {
    const res = await fetch(`${API_BASE}/me/health/weight`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch weight');
    return res.json();
  },
  createWeight: async (data: { weight: number; date?: string; notes?: string }) => {
    const res = await fetch(`${API_BASE}/me/health/weight`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to record weight');
    return res.json();
  },
  deleteWeight: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/health/weight/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete weight');
    return res.json();
  },

  getWorkouts: async () => {
    const res = await fetch(`${API_BASE}/me/health/workouts`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch workouts');
    return res.json();
  },
  createWorkout: async (data: any) => {
    const res = await fetch(`${API_BASE}/me/health/workouts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to log workout');
    return res.json();
  },
  deleteWorkout: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/health/workouts/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete workout');
    return res.json();
  },

  // --- Learning ---
  getStudySessions: async () => {
    const res = await fetch(`${API_BASE}/me/learning/study`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch study sessions');
    return res.json();
  },
  createStudySession: async (data: any) => {
    const res = await fetch(`${API_BASE}/me/learning/study`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to log study session');
    return res.json();
  },
  deleteStudySession: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/learning/study/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete study session');
    return res.json();
  },

  getCourses: async () => {
    const res = await fetch(`${API_BASE}/me/learning/courses`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
  },
  createCourse: async (data: any) => {
    const res = await fetch(`${API_BASE}/me/learning/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create course');
    return res.json();
  },
  updateCourse: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/me/learning/courses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update course');
    return res.json();
  },
  deleteCourse: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/learning/courses/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete course');
    return res.json();
  },

  getProjects: async () => {
    const res = await fetch(`${API_BASE}/me/learning/projects`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },
  createProject: async (data: any) => {
    const res = await fetch(`${API_BASE}/me/learning/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },
  updateProject: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/me/learning/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },
  deleteProject: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/learning/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  // --- Life ---
  getTasks: async (params?: { status?: string; category?: string; priority?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/me/life/tasks?${q}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },
  createTask: async (data: any) => {
    const res = await fetch(`${API_BASE}/me/life/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },
  updateTask: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/me/life/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },
  deleteTask: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/life/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  getHabits: async () => {
    const res = await fetch(`${API_BASE}/me/life/habits`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch habits');
    return res.json();
  },
  createHabit: async (data: any) => {
    const res = await fetch(`${API_BASE}/me/life/habits`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create habit');
    return res.json();
  },
  toggleHabit: async (id: string, date?: string) => {
    const res = await fetch(`${API_BASE}/me/life/habits/${id}/toggle`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ date })
    });
    if (!res.ok) throw new Error('Failed to toggle habit');
    return res.json();
  },
  deleteHabit: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/life/habits/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete habit');
    return res.json();
  },

  getJournal: async (params?: { search?: string; tag?: string; mood?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/me/life/journal?${q}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch journal');
    return res.json();
  },
  createJournal: async (data: any) => {
    const res = await fetch(`${API_BASE}/me/life/journal`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create journal entry');
    return res.json();
  },
  updateJournal: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/me/life/journal/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update journal entry');
    return res.json();
  },
  deleteJournal: async (id: string) => {
    const res = await fetch(`${API_BASE}/me/life/journal/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete journal entry');
    return res.json();
  }
};
