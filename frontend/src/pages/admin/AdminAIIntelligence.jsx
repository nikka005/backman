import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { adminAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { 
  Brain, MessageSquare, TrendingUp, Shield, Settings, 
  Send, Loader2, ChevronRight, Sparkles, AlertTriangle,
  BarChart3, User, Clock, Check, X, RefreshCw, History,
  Trash2, PlusCircle, FileText, Activity
} from 'lucide-react';

export default function AdminAIIntelligence() {
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  
  // Chat state
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  // Growth Planning state
  const [growthPlans, setGrowthPlans] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]);
  
  // Analytics state
  const [analyticsInsights, setAnalyticsInsights] = useState([]);
  const [analysisType, setAnalysisType] = useState('general');
  const [timePeriod, setTimePeriod] = useState('last_30_days');
  
  // Risk Assessment state
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [riskTargetType, setRiskTargetType] = useState('platform');
  const [riskTargetId, setRiskTargetId] = useState('');
  
  // Logs state
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [statsRes, settingsRes, convsRes, usersRes] = await Promise.all([
        adminAPI.aiGetStats(),
        adminAPI.aiGetSettings(),
        adminAPI.aiGetConversations(),
        adminAPI.getUsers({ limit: 100 })
      ]);
      setStats(statsRes.data);
      setSettings(settingsRes.data);
      setConversations(convsRes.data.conversations || []);
      setUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Failed to load AI data:', error);
      toast.error('Failed to load AI Intelligence data');
    } finally {
      setLoading(false);
    }
  };

  // Chat Functions
  const startNewChat = () => {
    setActiveConversation({ id: null, messages: [], title: 'New Conversation' });
    setChatInput('');
  };

  const loadConversation = async (convId) => {
    try {
      const response = await adminAPI.aiGetConversation(convId);
      setActiveConversation(response.data);
    } catch (error) {
      toast.error('Failed to load conversation');
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const message = chatInput.trim();
    setChatInput('');
    setChatLoading(true);
    
    // Optimistically add user message
    setActiveConversation(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), { role: 'user', content: message, timestamp: new Date().toISOString() }]
    }));
    
    try {
      const response = await adminAPI.aiChat(message, activeConversation?.id);
      const { response: aiResponse, conversation_id, provider_used, model_used } = response.data;
      
      setActiveConversation(prev => ({
        ...prev,
        id: conversation_id,
        messages: [...(prev?.messages || []), { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString(), provider: provider_used, model: model_used }]
      }));
      
      // Refresh conversations list
      const convsRes = await adminAPI.aiGetConversations();
      setConversations(convsRes.data.conversations || []);
    } catch (error) {
      toast.error('Failed to send message');
      // Remove optimistic message
      setActiveConversation(prev => ({
        ...prev,
        messages: prev?.messages?.slice(0, -1) || []
      }));
    } finally {
      setChatLoading(false);
    }
  };

  const deleteConversation = async (convId) => {
    try {
      await adminAPI.aiDeleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConversation?.id === convId) {
        setActiveConversation(null);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  // Growth Planning Functions
  const generateGrowthPlan = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }
    
    setLoading(true);
    try {
      const response = await adminAPI.aiGenerateGrowthPlan(selectedUserId);
      toast.success('Growth plan generated successfully');
      loadGrowthPlans();
    } catch (error) {
      toast.error('Failed to generate growth plan');
    } finally {
      setLoading(false);
    }
  };

  const loadGrowthPlans = async () => {
    try {
      const response = await adminAPI.aiGetGrowthPlans();
      setGrowthPlans(response.data.plans || []);
    } catch (error) {
      console.error('Failed to load growth plans:', error);
    }
  };

  const approveGrowthPlan = async (planId) => {
    try {
      await adminAPI.aiApproveGrowthPlan(planId);
      toast.success('Plan approved and activated');
      loadGrowthPlans();
    } catch (error) {
      toast.error('Failed to approve plan');
    }
  };

  // Analytics Functions
  const runAnalysis = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.aiAnalyzeAnalytics(analysisType, timePeriod);
      toast.success('Analysis completed');
      loadAnalyticsInsights();
    } catch (error) {
      toast.error('Failed to run analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsInsights = async () => {
    try {
      const response = await adminAPI.aiGetAnalyticsInsights();
      setAnalyticsInsights(response.data.insights || []);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  // Risk Assessment Functions
  const runRiskAssessment = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.aiAssessRisk(riskTargetType, riskTargetId || null);
      toast.success('Risk assessment completed');
      loadRiskAssessments();
    } catch (error) {
      toast.error('Failed to run risk assessment');
    } finally {
      setLoading(false);
    }
  };

  const loadRiskAssessments = async () => {
    try {
      const response = await adminAPI.aiGetRiskAssessments();
      setRiskAssessments(response.data.assessments || []);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    }
  };

  // Settings Functions
  const updateSettings = async (key, value) => {
    try {
      await adminAPI.aiUpdateSettings({ [key]: value });
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  // Logs Functions
  const loadLogs = async (moduleType = null) => {
    try {
      const response = await adminAPI.aiGetLogs(moduleType);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-pink-500" />
            Adverlyx Intelligence
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Enterprise AI-powered decision support system
          </p>
        </div>
        <Button variant="outline" onClick={loadInitialData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Growth Plans</p>
                  <p className="text-2xl font-bold">{stats.total_growth_plans}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Analytics Insights</p>
                  <p className="text-2xl font-bold">{stats.total_analytics_insights}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Risk Assessments</p>
                  <p className="text-2xl font-bold">{stats.total_risk_assessments}</p>
                </div>
                <Shield className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.success_rate}%</p>
                </div>
                <Activity className="w-8 h-8 text-pink-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="chat" className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Growth</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Risk</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Conversations</CardTitle>
                  <Button size="sm" variant="ghost" onClick={startNewChat}>
                    <PlusCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No conversations yet</p>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.id}
                      className={`p-2 rounded cursor-pointer flex items-center justify-between group ${
                        activeConversation?.id === conv.id ? 'bg-pink-50 border border-pink-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => loadConversation(conv.id)}
                    >
                      <div className="truncate flex-1">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  <CardTitle className="text-lg">
                    {activeConversation?.title || 'AI Decision Support'}
                  </CardTitle>
                </div>
                <CardDescription>
                  Ask questions about users, analytics, platform performance, or get strategic advice
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                  {!activeConversation || activeConversation.messages?.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <Brain className="w-12 h-12 mb-4 opacity-30" />
                      <p className="text-sm">Start a conversation with Adverlyx Intelligence</p>
                      <p className="text-xs mt-2">Ask about user analytics, growth strategies, or platform insights</p>
                    </div>
                  ) : (
                    activeConversation.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-pink-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="text-sm prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-semibold prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask Adverlyx Intelligence..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="resize-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || chatLoading}
                      className="h-auto"
                    >
                      {chatLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Growth Planning Tab */}
        <TabsContent value="growth" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Generate Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Generate Growth Plan
                </CardTitle>
                <CardDescription>
                  AI-powered growth strategy for any user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select User</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={generateGrowthPlan} 
                  disabled={!selectedUserId || loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Generate Plan
                </Button>
              </CardContent>
            </Card>

            {/* Plans List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Growth Plans</CardTitle>
                  <Button variant="outline" size="sm" onClick={loadGrowthPlans}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {growthPlans.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No growth plans yet</p>
                  ) : (
                    growthPlans.map(plan => (
                      <div key={plan.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">User: {plan.user_id.slice(0, 8)}...</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                                {plan.status}
                              </Badge>
                              <Badge variant="outline">{plan.recommended_speed}</Badge>
                              <Badge variant={plan.risk_mode === 'low' ? 'default' : 'destructive'}>
                                Risk: {plan.risk_mode}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              Daily Target: {plan.daily_target_min}-{plan.daily_target_max} followers
                            </p>
                          </div>
                          {!plan.admin_approved && (
                            <Button size="sm" onClick={() => approveGrowthPlan(plan.id)}>
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Run Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Run AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Analysis Type</label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Overview</SelectItem>
                      <SelectItem value="performance">Performance Analysis</SelectItem>
                      <SelectItem value="trends">Trend Detection</SelectItem>
                      <SelectItem value="anomalies">Anomaly Detection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Time Period</label>
                  <Select value={timePeriod} onValueChange={setTimePeriod}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={runAnalysis} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Analyze
                </Button>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Analytics Insights</CardTitle>
                  <Button variant="outline" size="sm" onClick={loadAnalyticsInsights}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analyticsInsights.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No insights yet. Run an analysis to generate insights.</p>
                  ) : (
                    analyticsInsights.map(insight => (
                      <div key={insight.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{insight.title}</p>
                            <Badge variant="outline" className="mt-1">{insight.insight_type}</Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(insight.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-2 prose prose-sm max-w-none">
                          <ReactMarkdown>{insight.summary}</ReactMarkdown>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Run Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Target Type</label>
                  <Select value={riskTargetType} onValueChange={setRiskTargetType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">Platform-wide</SelectItem>
                      <SelectItem value="user">Specific User</SelectItem>
                      <SelectItem value="account">Instagram Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {riskTargetType !== 'platform' && (
                  <div>
                    <label className="text-sm font-medium">Target ID</label>
                    <Input
                      className="mt-1"
                      placeholder="Enter user or account ID"
                      value={riskTargetId}
                      onChange={(e) => setRiskTargetId(e.target.value)}
                    />
                  </div>
                )}
                <Button onClick={runRiskAssessment} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                  Assess Risk
                </Button>
              </CardContent>
            </Card>

            {/* Assessments */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Risk Assessments</CardTitle>
                  <Button variant="outline" size="sm" onClick={loadRiskAssessments}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {riskAssessments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No assessments yet</p>
                  ) : (
                    riskAssessments.map(assessment => (
                      <div key={assessment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium capitalize">{assessment.target_type} Assessment</p>
                            <Badge 
                              variant={
                                assessment.overall_risk_level === 'low' ? 'default' :
                                assessment.overall_risk_level === 'moderate' ? 'secondary' :
                                'destructive'
                              }
                              className="mt-1"
                            >
                              {assessment.overall_risk_level} Risk
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(assessment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap line-clamp-4">
                          {assessment.ai_reasoning}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module Toggles */}
            <Card>
              <CardHeader>
                <CardTitle>AI Modules</CardTitle>
                <CardDescription>Enable or disable AI modules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Growth Planning</p>
                        <p className="text-sm text-gray-500">AI-generated growth strategies</p>
                      </div>
                      <Switch
                        checked={settings.growth_planning_enabled}
                        onCheckedChange={(v) => updateSettings('growth_planning_enabled', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Analytics Intelligence</p>
                        <p className="text-sm text-gray-500">AI-powered analytics insights</p>
                      </div>
                      <Switch
                        checked={settings.analytics_intelligence_enabled}
                        onCheckedChange={(v) => updateSettings('analytics_intelligence_enabled', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Decision Support Chat</p>
                        <p className="text-sm text-gray-500">AI assistant for admin decisions</p>
                      </div>
                      <Switch
                        checked={settings.decision_support_enabled}
                        onCheckedChange={(v) => updateSettings('decision_support_enabled', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Risk Assessment</p>
                        <p className="text-sm text-gray-500">AI-driven risk analysis</p>
                      </div>
                      <Switch
                        checked={settings.risk_assessment_enabled}
                        onCheckedChange={(v) => updateSettings('risk_assessment_enabled', v)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Provider Settings */}
            <Card>
              <CardHeader>
                <CardTitle>AI Provider Settings</CardTitle>
                <CardDescription>Configure LLM providers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Primary Provider</label>
                      <div className="flex gap-2 mt-1">
                        <Input value={settings.primary_provider} disabled className="flex-1" />
                        <Input value={settings.primary_model} disabled className="flex-1" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">GPT-5.2 for complex reasoning</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fallback Provider</label>
                      <div className="flex gap-2 mt-1">
                        <Input value={settings.fallback_provider} disabled className="flex-1" />
                        <Input value={settings.fallback_model} disabled className="flex-1" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Claude for backup & long reports</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="font-medium">Learning Mode</p>
                        <p className="text-sm text-gray-500">Allow AI to improve over time</p>
                      </div>
                      <Switch
                        checked={settings.learning_enabled}
                        onCheckedChange={(v) => updateSettings('learning_enabled', v)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Activity Logs */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    AI Activity Logs
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => loadLogs()}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No activity logs yet</p>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{log.module_type}</Badge>
                          <span className="text-sm">{log.action}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{log.response_time_ms}ms</span>
                          {log.success ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
