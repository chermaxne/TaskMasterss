import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatButton from './src/ChatButton';

// Mock the ChatWindow component
jest.mock('./ChatWindow', () => (props) => (
  <div data-testid="chat-window-mock">
    Mock ChatWindow - Friend: {props.friend.username}
    <button onClick={props.onClose}>Close Mock</button>
  </div>
));

describe('ChatButton Component', () => {
  const mockUser = { id: 1, username: 'testuser' };
  const mockFriend = { id: 2, username: 'frienduser' };

  test('renders chat button initially', () => {
    render(<ChatButton user={mockUser} friend={mockFriend} />);
    expect(screen.getByText('💬 Chat')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-window-mock')).not.toBeInTheDocument();
  });

  test('opens chat window when button is clicked', () => {
    render(<ChatButton user={mockUser} friend={mockFriend} />);
    fireEvent.click(screen.getByText('💬 Chat'));
    
    expect(screen.getByTestId('chat-window-mock')).toBeInTheDocument();
    expect(screen.getByText(/Mock ChatWindow - Friend: frienduser/i)).toBeInTheDocument();
  });

  test('closes chat window when onClose is called', () => {
    render(<ChatButton user={mockUser} friend={mockFriend} />);
    
    // Open chat
    fireEvent.click(screen.getByText('💬 Chat'));
    expect(screen.getByTestId('chat-window-mock')).toBeInTheDocument();
    
    // Close chat
    fireEvent.click(screen.getByText('Close Mock'));
    expect(screen.queryByTestId('chat-window-mock')).not.toBeInTheDocument();
  });
});