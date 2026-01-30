import { useState } from 'react';
import { aiOnboardingAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { 
  Sparkles, Target, Hash, Users, MapPin, Zap, Shield, 
  ChevronRight, Check, Loader2, AlertCircle, TrendingUp,
  Crown, Edit3, X
} from 'lucide-react';

export default function AIOnboardingRecommendations({ onComplete, onSkip }) {
  const [step, setStep] = useState(1); // 1: Input, 2: Loading, 3: Results
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState('');
  
  // User inputs
  const [primaryGoal, setPrimaryGoal] = useState('creator_growth');
  const [growthUrgency, setGrowthUrgency] = useState('balanced');
  const [targetCountry, setTargetCountry] = useState('');
  const [competitors, setCompetitors] = useState('');

  const getRecommendations = async () => {
    setLoading(true);
    setError('');
    setStep(2);
    
    try {
      const input = {
        primary_goal: primaryGoal,
        growth_urgency: growthUrgency,
        target_country: targetCountry || null,
        competitors: competitors ? competitors.split(',').map(c => c.trim().replace('@', '')).filter(c => c) : []
      };
      
      const response = await aiOnboardingAPI.getRecommendations(input);
      setRecommendation(response.data);
      setStep(3);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      setError(error.response?.data?.detail || 'Failed to get AI recommendations. Please try again.');
      toast.error('Failed to get AI recommendations');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendations = async () => {
    if (!recommendation) return;
    
    setApplying(true);
    setError('');
    try {
      await aiOnboardingAPI.applyRecommendations(recommendation.id);
      toast.success('AI recommendations applied successfully!');
      onComplete?.(recommendation);
    } catch (error) {
      console.error('Failed to apply recommendations:', error);
      setError(error.response?.data?.detail || 'Failed to apply recommendations');
      toast.error('Failed to apply recommendations. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // Step 1: Input Form
  if (step === 1) {
    return (
      <Card className="w-full max-w-lg mx-auto border-pink-200 shadow-lg">
        <CardHeader className="text-center pb-2 px-4 md:px-6">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-lg md:text-xl">AI Growth Setup</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Let our AI analyze your account and recommend optimal settings
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 md:space-y-6 pt-2 md:pt-4 px-4 md:px-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          
          {/* Primary Goal */}
          <div className="space-y-2 md:space-y-3">
            <Label className="text-xs md:text-sm font-medium">What&apos;s your primary goal?</Label>
            <RadioGroup value={primaryGoal} onValueChange={setPrimaryGoal} className="grid grid-cols-1 gap-2">
              {[
                { value: 'brand_awareness', label: 'Brand Awareness', desc: 'Increase visibility and reach' },
                { value: 'leads_sales', label: 'Leads & Sales', desc: 'Convert followers to customers' },
                { value: 'creator_growth', label: 'Creator Growth', desc: 'Build engaged audience' }
              ].map((option) => (
                <div 
                  key={option.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${primaryGoal === option.value ? 'border-pink-500 bg-pink-50' : 'hover:border-gray-300'}`}
                  onClick={() => setPrimaryGoal(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    <span className="font-medium text-sm">{option.label}</span>
                    <p className="text-[10px] md:text-xs text-gray-500">{option.desc}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Growth Urgency */}
          <div className="space-y-2 md:space-y-3">
            <Label className="text-xs md:text-sm font-medium">Growth approach preference</Label>
            <RadioGroup value={growthUrgency} onValueChange={setGrowthUrgency} className="grid grid-cols-3 gap-2">
              {[
                { value: 'slow_safe', icon: Shield, label: 'Slow & Safe', color: 'text-green-500' },
                { value: 'balanced', icon: Target, label: 'Balanced', color: 'text-blue-500', recommended: true },
                { value: 'faster', icon: Zap, label: 'Faster', color: 'text-orange-500' }
              ].map((option) => (
                <div 
                  key={option.value}
                  className={`flex flex-col items-center p-2 md:p-3 rounded-lg border cursor-pointer transition-all ${growthUrgency === option.value ? 'border-pink-500 bg-pink-50' : 'hover:border-gray-300'}`}
                  onClick={() => setGrowthUrgency(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <option.icon className={`w-4 h-4 md:w-5 md:h-5 mb-1 ${option.color}`} />
                  <span className="text-[10px] md:text-sm font-medium text-center">{option.label}</span>
                  {option.recommended && (
                    <Badge className="mt-1 text-[8px] md:text-xs px-1 py-0" variant="secondary">Best</Badge>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1 md:space-y-2">
              <Label className="text-xs md:text-sm font-medium">Target Country (optional)</Label>
              <Input 
                placeholder="e.g., USA, UK" 
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1 md:space-y-2">
              <Label className="text-xs md:text-sm font-medium">Competitors (optional)</Label>
              <Input 
                placeholder="@account1, @account2" 
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t px-4 md:px-6 pb-4">
          <Button variant="ghost" onClick={onSkip} className="w-full sm:w-auto order-2 sm:order-1">
            Skip for now
          </Button>
          <Button 
            onClick={getRecommendations} 
            className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 order-1 sm:order-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Analyzing...
              </>
            ) : (
              <>
                Get AI Recommendations
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Step 2: Loading
  if (step === 2) {
    return (
      <Card className="max-w-2xl mx-auto border-pink-200 shadow-lg">
        <CardContent className="py-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyzing Your Account</h3>
          <p className="text-gray-500 text-sm">
            Our AI is reviewing your profile and creating personalized recommendations...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Results
  if (step === 3 && recommendation) {
    const { recommended_settings, suggested_plan, plan_reason, confidence_level, growth_expectation, safety_notes, ai_analysis_summary, can_edit } = recommendation;
    
    return (
      <Card className="max-w-2xl mx-auto border-pink-200 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Your AI Growth Setup is Ready</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={confidence_level === 'high' ? 'default' : 'secondary'}>
                    {confidence_level} confidence
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              <Edit3 className="w-4 h-4 mr-1" />
              Redo
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5 pt-4">
          {/* AI Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">{ai_analysis_summary}</p>
          </div>

          {/* Detected Niche */}
          <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
            <Target className="w-5 h-5 text-pink-500" />
            <div>
              <p className="text-xs text-gray-500">Detected Niche</p>
              <p className="font-medium capitalize">{recommended_settings.niche}</p>
            </div>
          </div>

          {/* Recommended Hashtags */}
          {recommended_settings.hashtags?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Recommended Hashtags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recommended_settings.hashtags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Similar Accounts */}
          {recommended_settings.similar_accounts?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Similar Accounts to Target</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recommended_settings.similar_accounts.map((account, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">@{account}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          {recommended_settings.locations?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Target Locations</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recommended_settings.locations.map((loc, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{loc}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Growth Intensity */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Growth Intensity</p>
              <p className="font-medium capitalize">{recommended_settings.growth_intensity}</p>
            </div>
          </div>

          {/* Plan Recommendation */}
          <div className="border rounded-lg p-4 bg-gradient-to-r from-pink-50 to-purple-50">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Recommended Plan</p>
                <p className="font-semibold capitalize text-lg">{suggested_plan} Plan</p>
                <p className="text-sm text-gray-600 mt-1">{plan_reason}</p>
              </div>
            </div>
          </div>

          {/* Growth Expectation */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">{growth_expectation}</p>
            </div>
          </div>

          {/* Safety Note */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield className="w-4 h-4 text-green-500" />
            <span>{safety_notes}</span>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onSkip}>
            <X className="w-4 h-4 mr-1" />
            Skip
          </Button>
          <div className="flex gap-2">
            {can_edit && (
              <Button variant="outline" onClick={() => onComplete?.(recommendation)}>
                <Edit3 className="w-4 h-4 mr-1" />
                Customize
              </Button>
            )}
            <Button 
              onClick={applyRecommendations} 
              disabled={applying}
              className="bg-gradient-to-r from-pink-500 to-purple-600"
            >
              {applying ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              Apply Settings
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return null;
}
