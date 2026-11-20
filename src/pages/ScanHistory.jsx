import { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Trash2, X, Image as ImageIcon, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getTranslation } from '../utils/i18n';
import ExportShare from '../components/ExportShare';
import { syncUserData } from '../utils/userDataSync';

export default function ScanHistory() {
  const navigate = useNavigate();
  const t = getTranslation;
  const [scans, setScans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time'); // 'All Time', 'Today', 'This Week', 'This Month', 'Custom'
  const [typeFilter, setTypeFilter] = useState('All'); // 'All', 'Crop', 'Livestock', 'Critical'
  const [customDate, setCustomDate] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    const loadScans = () => {
      const history = JSON.parse(localStorage.getItem('smartAgHistory') || '[]');
      setScans(history);
    };

    loadScans();
    window.addEventListener('kisanalert_data_synced', loadScans);
    return () => window.removeEventListener('kisanalert_data_synced', loadScans);
  }, []);

  // Delete single scan
  const deleteScan = (scanId, e) => {
    e?.stopPropagation();
    const updated = scans.filter(s => s.id !== scanId);
    setScans(updated);
    localStorage.setItem('smartAgHistory', JSON.stringify(updated));
    syncUserData();
    if (selectedScan?.id === scanId) setSelectedScan(null);
  };

  // Clear all filtered or all scans
  const clearAllScans = () => {
    if (!window.confirm(t('Are you sure you want to delete all scans?'))) return;
    setScans([]);
    localStorage.setItem('smartAgHistory', '[]');
    syncUserData();
  };

  // Date filtering logic
  const isWithinDateRange = (scanDateStr, filter) => {
    if (!scanDateStr || filter === 'All Time') return true;

    const scanTimestamp = Date.parse(scanDateStr);
    const now = new Date();

    if (filter === 'Custom' && customDate) {
      const scanDateObj = new Date(scanTimestamp || scanDateStr);
      const chosenDateObj = new Date(customDate);
      return (
        scanDateObj.getFullYear() === chosenDateObj.getFullYear() &&
        scanDateObj.getMonth() === chosenDateObj.getMonth() &&
        scanDateObj.getDate() === chosenDateObj.getDate()
      );
    }

    if (isNaN(scanTimestamp)) {
      // Fallback matching for locale date strings
      const todayStr = new Date().toLocaleDateString();
      if (filter === 'Today') return scanDateStr === todayStr;
      return true;
    }

    const scanDate = new Date(scanTimestamp);
    const diffTime = Math.abs(now - scanDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (filter === 'Today') {
      return diffDays <= 1 && scanDate.getDate() === now.getDate();
    }
    if (filter === 'This Week') {
      return diffDays <= 7;
    }
    if (filter === 'This Month') {
      return diffDays <= 30;
    }

    return true;
  };

  // Filtered scans
  const filteredScans = scans.filter(scan => {
    // 1. Search filter (crop / livestock name or diagnosis)
    const matchesSearch =
      !searchTerm.trim() ||
      (scan.identity && scan.identity.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (scan.diagnosis && scan.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (scan.type && scan.type.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Type / Severity filter
    let matchesType = true;
    if (typeFilter === 'Crop') matchesType = scan.type === 'Crop';
    else if (typeFilter === 'Livestock') matchesType = scan.type === 'Livestock';
    else if (typeFilter === 'Critical') matchesType = scan.severity === 'Critical';

    // 3. Date filter
    const matchesDate = isWithinDateRange(scan.date, dateFilter);

    return matchesSearch && matchesType && matchesDate;
  });

  return (
    <div className="pb-24">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pt-2 mb-4">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-sage hover:text-aqua transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("Back to Home") || "Back"}
        </Link>
        {scans.length > 0 && (
          <button
            onClick={clearAllScans}
            className="text-alert/80 hover:text-alert font-display text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg bg-alert/5 border border-alert/10 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t("Clear All")}
          </button>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-ocean dark:bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg mb-6 border border-ocean/20 dark:border-white/10 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl uppercase leading-none tracking-tight">
              {t("Scan History") || "Scan History"}
            </h1>
            <p className="font-body text-white/60 text-xs sm:text-sm mt-1">
              {scans.length} {t("Total Scans Recorded") || "scans saved on this device"}
            </p>
          </div>
          <button
            onClick={() => navigate('/camera')}
            className="self-start sm:self-auto bg-aqua hover:bg-aquaLight text-white font-display text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            + {t("New Scan") || "New Scan"}
          </button>
        </div>

        {/* Live Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("Search by crop name, animal breed, or disease...") || "Search by crop, breed, or disease..."}
            className="w-full bg-white/10 focus:bg-white/15 h-12 rounded-xl pl-12 pr-10 text-sm font-medium text-white placeholder-white/40 outline-none border border-white/15 focus:border-aqua transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs: Date & Type */}
      <div className="space-y-3 mb-6">
        {/* Date Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1">
          <span className="font-display text-[10px] uppercase tracking-widest text-charcoalDark/40 dark:text-white/40 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5" /> Date:
          </span>
          {['All Time', 'Today', 'This Week', 'This Month'].map((period) => (
            <button
              key={period}
              onClick={() => setDateFilter(period)}
              className={`px-3.5 py-1.5 rounded-lg font-display text-[11px] uppercase tracking-wider whitespace-nowrap transition-all border ${
                dateFilter === period
                  ? 'bg-ocean text-white border-ocean dark:bg-aqua dark:text-charcoal dark:border-aqua shadow-sm'
                  : 'bg-white dark:bg-white/5 text-charcoalDark/60 dark:text-white/60 border-charcoalDark/10 dark:border-white/10 hover:border-aqua/40'
              }`}
            >
              {t(period) || period}
            </button>
          ))}
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateFilter('Custom');
            }}
            className="bg-white dark:bg-white/5 border border-charcoalDark/10 dark:border-white/10 text-charcoalDark/70 dark:text-white/70 px-2 py-1 rounded-lg text-xs outline-none"
            title="Filter by exact date"
          />
        </div>

        {/* Type / Category Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1">
          <span className="font-display text-[10px] uppercase tracking-widest text-charcoalDark/40 dark:text-white/40 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          {['All', 'Crop', 'Livestock', 'Critical'].map((cat) => (
            <button
              key={cat}
              onClick={() => setTypeFilter(cat)}
              className={`px-3.5 py-1.5 rounded-lg font-display text-[11px] uppercase tracking-wider whitespace-nowrap transition-all border ${
                typeFilter === cat
                  ? 'bg-aqua text-white border-aqua dark:bg-aqua dark:text-charcoal shadow-sm'
                  : 'bg-white dark:bg-white/5 text-charcoalDark/60 dark:text-white/60 border-charcoalDark/10 dark:border-white/10 hover:border-aqua/40'
              }`}
            >
              {cat === 'Critical' ? '⚠️ Critical' : t(cat) || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scans Count Bar */}
      <div className="flex justify-between items-center mb-4 px-1">
        <p className="font-display text-[11px] uppercase tracking-widest text-charcoalDark/50 dark:text-white/50">
          {filteredScans.length} {t("Results Found") || "results found"}
        </p>
        {(searchTerm || dateFilter !== 'All Time' || typeFilter !== 'All') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFilter('All Time');
              setTypeFilter('All');
              setCustomDate('');
            }}
            className="text-xs text-aqua hover:underline font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Dynamic Scan Cards List */}
      <div className="space-y-3">
        {filteredScans.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-charcoalDark/15 dark:border-white/15 rounded-2xl bg-white/40 dark:bg-white/5">
            <div className="w-12 h-12 bg-charcoalDark/5 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-charcoalDark/40 dark:text-white/40">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-display text-charcoalDark dark:text-white text-base uppercase tracking-wider">
              {t("No scans found.")}
            </p>
            <p className="font-body text-xs text-charcoalDark/50 dark:text-white/50 mt-1 max-w-sm mx-auto">
              {scans.length === 0
                ? "You haven't scanned any crops or livestock yet. Tap 'New Scan' to begin."
                : "No past scans match your current search and date filters."}
            </p>
            {scans.length === 0 && (
              <button
                onClick={() => navigate('/camera')}
                className="mt-4 bg-aqua text-white font-display text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl shadow"
              >
                Start First Scan
              </button>
            )}
          </div>
        ) : (
          filteredScans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => setSelectedScan(scan)}
              className="w-full bg-white dark:bg-white/5 p-4 rounded-xl flex items-center justify-between border border-charcoalDark/10 dark:border-white/10 shadow-sm text-left hover:border-aqua/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 sm:gap-4 overflow-hidden flex-1 min-w-0">
                {scan.image ? (
                  <img
                    src={scan.image}
                    alt={scan.identity}
                    className="w-14 h-14 rounded-xl object-cover bg-charcoalDark/5 border border-charcoalDark/10 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-charcoalDark/5 dark:bg-white/10 rounded-xl flex items-center justify-center text-charcoalDark/40 dark:text-white/40 shrink-0 border border-charcoalDark/10">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="overflow-hidden pr-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[9px] uppercase tracking-widest text-ocean/60 dark:text-aqua/80">
                      {scan.type}
                    </span>
                    <span className="text-[10px] text-charcoalDark/40 dark:text-white/40">&bull;</span>
                    <span className="font-body text-[11px] text-charcoalDark/50 dark:text-white/50">
                      {scan.date}
                    </span>
                  </div>
                  <p className="font-display text-charcoalDark dark:text-white text-base sm:text-lg uppercase leading-tight truncate mt-0.5 group-hover:text-aqua transition-colors">
                    {scan.identity}
                  </p>
                  <p className="font-body font-medium text-xs text-charcoalDark/70 dark:text-white/70 truncate mt-0.5">
                    {scan.diagnosis}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="font-display text-xs text-charcoalDark/40 dark:text-white/40 uppercase tracking-widest">Health</p>
                  <p className={`font-display text-base leading-none ${scan.healthPercentage >= 80 ? 'text-leaf' : scan.healthPercentage >= 50 ? 'text-harvest' : 'text-alert'}`}>
                    {scan.healthPercentage || 0}%
                  </p>
                </div>
                <span
                  className={`font-display text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                    scan.severity === 'Healthy'
                      ? 'bg-leaf/10 text-leaf border-leaf/20'
                      : scan.severity === 'Critical'
                      ? 'bg-alert/10 text-alert border-alert/20'
                      : 'bg-harvest/10 text-harvest border-harvest/20'
                  }`}
                >
                  {scan.severity}
                </span>
                <button
                  onClick={(e) => deleteScan(scan.id, e)}
                  title="Delete scan"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoalDark/30 hover:text-alert hover:bg-alert/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Scan Details Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-charcoalDark/80 backdrop-blur-sm p-0 sm:p-6">
          <div className="bg-[#f8f9fa] dark:bg-charcoalDark w-full max-w-lg h-[95dvh] sm:h-[85vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-t sm:border border-charcoalDark/20 dark:border-white/10 animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="p-5 flex justify-between items-center bg-white dark:bg-white/5 border-b border-charcoalDark/10 dark:border-white/10 shrink-0">
              <h3 className="font-display text-charcoalDark dark:text-white text-xl uppercase tracking-widest">
                {t("Scan Details")}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => deleteScan(selectedScan.id, e)}
                  className="w-10 h-10 rounded-xl bg-alert/10 flex items-center justify-center text-alert hover:bg-alert/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedScan(null)}
                  className="w-10 h-10 rounded-xl bg-charcoalDark/5 dark:bg-white/10 flex items-center justify-center text-charcoalDark dark:text-white hover:bg-charcoalDark/10 dark:hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scroll p-5 sm:p-6 space-y-5">
              {selectedScan.image && (
                <div className="w-full h-56 rounded-xl overflow-hidden border border-charcoalDark/10 dark:border-white/10 shadow-sm relative">
                  <img src={selectedScan.image} alt="Scanned subject" className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 right-3 bg-white dark:bg-charcoalDark font-display text-xs px-3 py-1.5 rounded-lg shadow-md text-charcoalDark dark:text-white uppercase tracking-widest">
                    {selectedScan.date}
                  </div>
                </div>
              )}

              {/* Subject Info */}
              <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-5 rounded-xl border border-charcoalDark/10 dark:border-white/10 shadow-sm">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-display text-2xl border shrink-0 ${selectedScan.healthPercentage >= 80 ? 'bg-leaf/10 text-leaf border-leaf/20' : selectedScan.healthPercentage >= 50 ? 'bg-harvest/10 text-harvest border-harvest/20' : 'bg-alert/10 text-alert border-alert/20'}`}>
                  {selectedScan.healthPercentage || 0}%
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="font-display text-charcoalDark/50 dark:text-white/50 text-[10px] uppercase tracking-widest truncate">
                    {t("Identified")} {t(selectedScan.type)}
                  </p>
                  <p className="font-display text-charcoalDark dark:text-white text-2xl uppercase leading-tight truncate mt-1">
                    {selectedScan.identity}
                  </p>
                </div>
              </div>

              {/* Diagnosis & Urgency */}
              <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-charcoalDark/10 dark:border-white/10 shadow-sm border-l-4" style={{ borderLeftColor: selectedScan.severity === 'Healthy' ? '#16A34A' : '#DC2626' }}>
                <p className="font-display text-charcoalDark/50 dark:text-white/50 text-[10px] uppercase tracking-widest mb-2">{t("Diagnosis")}</p>
                <p className="font-body font-bold text-charcoalDark dark:text-white text-base sm:text-lg">{selectedScan.diagnosis}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className={`font-display text-[10px] px-3 py-1.5 rounded-lg inline-block uppercase tracking-widest border ${selectedScan.severity === 'Critical' ? 'bg-alert/10 text-alert border-alert/20' : selectedScan.severity === 'Healthy' ? 'bg-leaf/10 text-leaf border-leaf/20' : 'bg-harvest/10 text-harvest border-harvest/20'}`}>
                    {t("Severity")}: {selectedScan.severity}
                  </div>
                  {selectedScan.urgency && (
                    <div className={`font-display text-[10px] px-3 py-1.5 rounded-lg inline-block uppercase tracking-widest border ${selectedScan.urgency === 'Immediate' ? 'bg-alert/10 text-alert border-alert/20' : selectedScan.urgency === 'Within 24h' ? 'bg-harvest/10 text-harvest border-harvest/20' : 'bg-leaf/10 text-leaf border-leaf/20'}`}>
                      🕐 {selectedScan.urgency}
                    </div>
                  )}
                </div>
              </div>

              {/* Water Stress */}
              {selectedScan.waterStress && (
                <div className="glass-water p-5 rounded-xl">
                  <p className="font-display text-ocean dark:text-aqua text-[10px] uppercase tracking-widest mb-2">💧 {t("Water Stress")}</p>
                  <p className="font-body font-bold text-charcoalDark dark:text-white text-base">{selectedScan.waterStress}</p>
                  {selectedScan.irrigationAdvice && (
                    <p className="font-body font-medium text-charcoalDark/70 dark:text-white/70 text-sm mt-2 leading-relaxed">{selectedScan.irrigationAdvice}</p>
                  )}
                </div>
              )}

              {/* Immediate Care */}
              {selectedScan.immediateCare && (
                <div className="bg-harvest/10 border border-harvest/20 p-5 rounded-xl">
                  <p className="font-display text-harvest text-[10px] uppercase tracking-widest mb-2">⚡ {t("Immediate Care")}</p>
                  <p className="font-body font-medium text-charcoalDark dark:text-white text-sm sm:text-base leading-relaxed">{selectedScan.immediateCare}</p>
                </div>
              )}

              {/* Action Plan */}
              {selectedScan.actionPlan && (
                <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-charcoalDark/10 dark:border-white/10 shadow-sm">
                  <p className="font-display text-charcoalDark/50 dark:text-white/50 text-[10px] uppercase tracking-widest mb-2">{t("Precaution & Action Plan")}</p>
                  <p className="font-body font-medium text-charcoalDark/80 dark:text-white/80 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{selectedScan.actionPlan}</p>
                </div>
              )}

              {/* Export & WhatsApp Share */}
              <ExportShare scan={selectedScan} onClose={() => setSelectedScan(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
