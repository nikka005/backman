import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Download, FileSpreadsheet, FileJson, Loader2, Users,
  CreditCard, DollarSign, Instagram, MessageSquare, BarChart3,
  Calendar, TrendingUp, FileText, Check
} from 'lucide-react';

const AdminExport = () => {
  const [exporting, setExporting] = useState({});
  const [exportDays, setExportDays] = useState(30);
  const [exportSuccess, setExportSuccess] = useState({});

  const exportTypes = [
    {
      key: 'users',
      label: 'Users',
      description: 'Export all user data',
      icon: Users,
      color: 'blue',
      formats: ['csv', 'json']
    },
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      description: 'Export subscription data',
      icon: CreditCard,
      color: 'purple',
      formats: ['csv', 'json']
    },
    {
      key: 'payments',
      label: 'Payments',
      description: 'Export payment transactions',
      icon: DollarSign,
      color: 'green',
      formats: ['csv', 'json']
    },
    {
      key: 'analytics',
      label: 'Analytics',
      description: 'Export platform analytics',
      icon: BarChart3,
      color: 'orange',
      formats: ['csv', 'json']
    },
    {
      key: 'instagram',
      label: 'Instagram Accounts',
      description: 'Export connected accounts',
      icon: Instagram,
      color: 'pink',
      formats: ['csv', 'json']
    },
    {
      key: 'tickets',
      label: 'Support Tickets',
      description: 'Export support tickets',
      icon: MessageSquare,
      color: 'yellow',
      formats: ['csv', 'json']
    },
    {
      key: 'funnel',
      label: 'Funnel Events',
      description: 'Export conversion funnel events',
      icon: TrendingUp,
      color: 'cyan',
      formats: ['csv', 'json']
    },
    {
      key: 'growth',
      label: 'Growth Logs',
      description: 'Export Instagram growth activity',
      icon: TrendingUp,
      color: 'emerald',
      formats: ['csv', 'json']
    }
  ];

  const handleExport = async (type, format) => {
    const key = `${type}_${format}`;
    setExporting({ ...exporting, [key]: true });
    
    try {
      let response;
      
      switch (type) {
        case 'users':
          response = await adminAPI.exportUsers(format);
          break;
        case 'subscriptions':
          response = await adminAPI.exportSubscriptions(format);
          break;
        case 'payments':
          response = await adminAPI.exportPayments(format);
          break;
        case 'analytics':
          response = await adminAPI.exportAnalytics(format, exportDays);
          break;
        case 'instagram':
          response = await adminAPI.exportInstagramAccounts(format);
          break;
        case 'tickets':
          response = await adminAPI.exportTickets(format);
          break;
        case 'funnel':
          response = await adminAPI.exportFunnelEvents(format, exportDays);
          break;
        case 'growth':
          response = await adminAPI.exportGrowthLogs(format, exportDays);
          break;
        default:
          throw new Error('Unknown export type');
      }
      
      // Download the file
      const blob = new Blob([response.data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportSuccess({ ...exportSuccess, [key]: true });
      setTimeout(() => {
        setExportSuccess({ ...exportSuccess, [key]: false });
      }, 3000);
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      alert(`Failed to export ${type}`);
    } finally {
      setExporting({ ...exporting, [key]: false });
    }
  };

  const handleFullReport = async () => {
    setExporting({ ...exporting, fullReport: true });
    try {
      const response = await adminAPI.exportFullReport(exportDays);
      
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `full_platform_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportSuccess({ ...exportSuccess, fullReport: true });
      setTimeout(() => {
        setExportSuccess({ ...exportSuccess, fullReport: false });
      }, 3000);
    } catch (error) {
      console.error('Error exporting full report:', error);
      alert('Failed to export full report');
    } finally {
      setExporting({ ...exporting, fullReport: false });
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      pink: 'bg-pink-100 text-pink-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      cyan: 'bg-cyan-100 text-cyan-600',
      emerald: 'bg-emerald-100 text-emerald-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div data-testid="export-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Export</h1>
          <p className="text-gray-500">Export platform data to CSV or JSON format</p>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="font-medium">Export Period:</span>
          <div className="flex gap-2">
            {[7, 30, 90, 365].map((days) => (
              <Button
                key={days}
                variant={exportDays === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportDays(days)}
                className={exportDays === days ? 'bg-pink-500' : ''}
              >
                {days === 365 ? '1 Year' : `${days} Days`}
              </Button>
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-4">
            (Applies to time-based exports like Analytics, Funnel Events, etc.)
          </span>
        </div>
      </div>

      {/* Full Report */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl shadow-sm p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Full Platform Report
            </h3>
            <p className="text-pink-100 mt-1">
              Comprehensive JSON report with all platform metrics, users, revenue, and more
            </p>
          </div>
          <Button 
            onClick={handleFullReport}
            disabled={exporting.fullReport}
            className="bg-white text-pink-600 hover:bg-pink-50 gap-2"
          >
            {exporting.fullReport ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : exportSuccess.fullReport ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exportSuccess.fullReport ? 'Downloaded!' : 'Download Report'}
          </Button>
        </div>
      </div>

      {/* Individual Exports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportTypes.map((type) => {
          const Icon = type.icon;
          return (
            <div key={type.key} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(type.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{type.label}</h3>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {type.formats.includes('csv') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleExport(type.key, 'csv')}
                    disabled={exporting[`${type.key}_csv`]}
                  >
                    {exporting[`${type.key}_csv`] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : exportSuccess[`${type.key}_csv`] ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    CSV
                  </Button>
                )}
                {type.formats.includes('json') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleExport(type.key, 'json')}
                    disabled={exporting[`${type.key}_json`]}
                  >
                    {exporting[`${type.key}_json`] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : exportSuccess[`${type.key}_json`] ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <FileJson className="w-4 h-4" />
                    )}
                    JSON
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminExport;
