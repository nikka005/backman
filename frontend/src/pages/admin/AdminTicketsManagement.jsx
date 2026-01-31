import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { MessageSquare, Eye, RefreshCw, Loader2 } from 'lucide-react';

const AdminTicketsManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTickets();
      setTickets(response.data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (ticketId, status) => {
    try {
      await adminAPI.updateTicket(ticketId, { status });
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setSendingReply(true);
    try {
      await adminAPI.updateTicket(selectedTicket.id, { 
        admin_response: replyMessage,
        status: 'in_progress'
      });
      setReplyMessage('');
      loadTickets();
      // Update selected ticket
      setSelectedTicket(prev => ({
        ...prev,
        admin_response: replyMessage,
        status: 'in_progress'
      }));
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div data-testid="admin-tickets-management">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500">Manage customer support requests</p>
        </div>
        <Button onClick={loadTickets} variant="outline" className="gap-2" data-testid="refresh-tickets-btn">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : tickets.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Subject</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">User</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Priority</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Created</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-gray-100" data-testid={`ticket-row-${ticket.id}`}>
                  <td className="py-4 px-6">
                    <p className="font-medium">{ticket.subject}</p>
                  </td>
                  <td className="py-4 px-6 text-gray-500">{ticket.user_email}</td>
                  <td className="py-4 px-6">
                    <Badge className={
                      ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }>
                      {ticket.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedTicket(ticket)} data-testid={`view-ticket-${ticket.id}`}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <select 
                        value={ticket.status}
                        onChange={(e) => updateStatus(ticket.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                        data-testid={`status-select-${ticket.id}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No support tickets</p>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-500">Ticket #{selectedTicket.id?.slice(0, 8)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>✕</Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge className={
                    selectedTicket.status === 'open' ? 'bg-blue-100 text-blue-700 mt-1' :
                    selectedTicket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 mt-1' :
                    selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700 mt-1' : 'bg-gray-100 text-gray-700 mt-1'
                  }>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Priority</p>
                  <Badge className={
                    selectedTicket.priority === 'high' ? 'bg-red-100 text-red-700 mt-1' :
                    selectedTicket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 mt-1' : 'bg-gray-100 text-gray-700 mt-1'
                  }>
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="font-medium text-sm mt-1">{new Date(selectedTicket.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 mb-1">From</p>
                <p className="text-gray-600">{selectedTicket.user_email}</p>
              </div>

              {/* Message */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Message</p>
                <div className="bg-blue-50 rounded-xl p-4 text-gray-700">
                  {selectedTicket.message || selectedTicket.description || 'No message content'}
                </div>
              </div>

              {/* Previous Response */}
              {selectedTicket.admin_response && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Previous Response</p>
                  <div className="bg-green-50 rounded-xl p-4 text-gray-700">
                    {selectedTicket.admin_response}
                  </div>
                </div>
              )}

              {/* Reply Form */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Reply to Customer</p>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full p-3 border rounded-xl resize-none h-32"
                  placeholder="Type your response here..."
                  data-testid="ticket-reply-textarea"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500"
                  onClick={sendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  data-testid="send-reply-btn"
                >
                  {sendingReply ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Reply
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => { updateStatus(selectedTicket.id, 'resolved'); setSelectedTicket(null); }}
                  className="text-green-600"
                  data-testid="mark-resolved-btn"
                >
                  Mark Resolved
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTicketsManagement;
