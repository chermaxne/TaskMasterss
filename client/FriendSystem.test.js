import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FriendSystem from './src/FriendSystem';

// Mock child components
jest.mock('./FriendsList', () => () => <div>Mock FriendsList</div>);
jest.mock('./FriendRequests', () => () => <div>Mock FriendRequests</div>);

describe('FriendSystem Component', () => {
  const mockUser = { id: 1, username: 'testuser' };
  const mockShowMessage = jest.fn();

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with tabs and switches between them', async () => {
    render(<FriendSystem user={mockUser} showMessage={mockShowMessage} />);
    
    expect(screen.getByText('Friend Hub')).toBeInTheDocument();
    expect(screen.getByText('Mock FriendsList')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Requests'));
    await waitFor(() => {
      expect(screen.getByText('Mock FriendRequests')).toBeInTheDocument();
    });
  });

  test('loads friends and requests on mount', async () => {
    render(<FriendSystem user={mockUser} showMessage={mockShowMessage} />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/friends/1'));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/requests/incoming/1'));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/requests/outgoing/1'));
    });
  });

  test('handles remove friend', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );
    
    const { rerender } = render(<FriendSystem user={mockUser} showMessage={mockShowMessage} />);
    
    // Mock the FriendsList with a remove handler
    jest.mock('./FriendsList', () => ({ onRemoveFriend }) => (
      <button onClick={() => onRemoveFriend(1)}>Test Remove</button>
    ));
    
    rerender(<FriendSystem user={mockUser} showMessage={mockShowMessage} />);
    
    fireEvent.click(screen.getByText('Test Remove'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/friends/1/1'), {
        method: 'DELETE'
      });
    });
  });

    test('renders without crashing', () => {
        render(<FriendSystem user={{}} showMessage={() => {}} />);
    });

});