import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Task from './src/Task';

// Mock fetch responses
const mockTasks = [
  { id: 1, name: 'Task 1', date: '2023-01-01', time: '12:00', priority: 'High', workload: '2hr', completed: false },
  { id: 2, name: 'Task 2', date: '2023-01-02', time: '14:00', priority: 'Medium', workload: '1hr', completed: true }
];

const mockSharedTasks = [
  { id: 3, name: 'Shared Task', date: '2023-01-03', time: '10:00', priority: 'Low', workload: '30min', completed: false, owner_username: 'otheruser' }
];

const mockFriends = [
  { id: 1, username: 'friend1' },
  { id: 2, username: 'friend2' }
];

describe('Task Component', () => {
  const mockUser = { id: 1, username: 'testuser' };
  const mockShowMessage = jest.fn();

  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/tasks/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTasks),
        });
      }
      if (url.includes('/tasks/shared/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSharedTasks),
        });
      }
      if (url.includes('/friends/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFriends),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders task statistics', async () => {
    render(<Task user={mockUser} showMessage={mockShowMessage} />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 personal + 1 shared
    });
  });

  test('creates a new task', async () => {
    render(<Task user={mockUser} showMessage={mockShowMessage} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter task name'), { target: { value: 'New Task' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., 2hr 30min'), { target: { value: '1hr' } });
    fireEvent.click(screen.getByText('Set Now'));
    fireEvent.click(screen.getByText('Create Task'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/tasks/1'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('New Task'),
      });
    });
  });

  test('toggles task completion', async () => {
    render(<Task user={mockUser} showMessage={mockShowMessage} />);
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/tasks/1'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, completed: true }),
      });
    });
  });

  test('deletes a task', async () => {
    window.confirm = jest.fn(() => true);
    
    render(<Task user={mockUser} showMessage={mockShowMessage} />);
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getAllByText('Delete')[0]);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/tasks/1'), {
        method: 'DELETE',
      });
    });
  });

  test('switches between personal and shared tasks', async () => {
    render(<Task user={mockUser} showMessage={mockShowMessage} />);
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Shared Tasks (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('Shared Task')).toBeInTheDocument();
      expect(screen.getByText('(Shared by otheruser)')).toBeInTheDocument();
    });
  });
});