import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWindow from './src/ChatWindow';

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      { id: 1, sender_id: 1, message: 'Hello', timestamp: '2023-01-01T00:00:00Z', sender_name: 'testuser' },
      { id: 2, sender_id: 2, message: 'Hi there', timestamp: '2023-01-01T00:01:00Z', sender_name: 'frienduser' }
    ]),
  })
);

beforeEach(() => {
  fetch.mockClear();
});

describe('ChatWindow Component', () => {
  const mockUser = { id: 1, username: 'testuser' };
  const mockFriend = { id: 2, username: 'frienduser' };
  const mockOnClose = jest.fn();

  test('renders chat window with header and form', async () => {
    render(<ChatWindow user={mockUser} friend={mockFriend} onClose={mockOnClose} />);
    
    expect(screen.getByText(`Chat with ${mockFriend.username}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /×/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
    
    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there')).toBeInTheDocument();
    });
  });

  test('calls onClose when close button is clicked', () => {
    render(<ChatWindow user={mockUser} friend={mockFriend} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /×/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('sends a new message', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 3, 
          sender_id: 1, 
          message: 'New message', 
          timestamp: new Date().toISOString()
        }),
      })
    );

    render(<ChatWindow user={mockUser} friend={mockFriend} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: /Send/i });
    
    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/messages'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender_id: mockUser.id,
          receiver_id: mockFriend.id,
          message: 'New message'
        })
      });
      
      expect(input).toHaveValue('');
    });
  });

  test('shows error when message sending fails', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<ChatWindow user={mockUser} friend={mockFriend} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: /Send/i });
    
    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });
    
    consoleError.mockRestore();
  });
});