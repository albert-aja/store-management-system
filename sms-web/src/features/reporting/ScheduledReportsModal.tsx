import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PeopleIcon from '@mui/icons-material/People';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { reportingApi } from './api';
import type {
  ScheduledReportConfig,
  ScheduledReportLog,
  RecipientPreview,
  ScheduledReportType,
  ScheduleFrequency,
} from './types';
import { useStores } from '../stores/hooks';
import { t } from '../../lib/locale';

interface ScheduledReportsModalProps {
  open: boolean;
  onClose: () => void;
  selectedStoreId?: string;
}

export const ScheduledReportsModal: React.FC<ScheduledReportsModalProps> = ({
  open,
  onClose,
  selectedStoreId,
}) => {
  const { data: stores = [] } = useStores();
  const [activeTab, setActiveTab] = useState(0);

  // Configurations state
  const [configs, setConfigs] = useState<ScheduledReportConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  // Execution logs state
  const [logs, setLogs] = useState<ScheduledReportLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [reportType, setReportType] = useState<ScheduledReportType>('ALL_COMBINED');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('DAILY');
  const [dayOfWeek, setDayOfWeek] = useState('MONDAY');
  const [dispatchTime, setDispatchTime] = useState('08:00');
  const [storeId, setStoreId] = useState('');
  const [targetRole, setTargetRole] = useState('MANAGER');
  const [customEmails, setCustomEmails] = useState('');
  const [saving, setSaving] = useState(false);

  // Recipient preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null);

  // Trigger feedback
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ text: string; severity: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (open) {
      loadConfigs();
      loadLogs();
      setAlertMsg(null);
    }
  }, [open, selectedStoreId]);

  const loadConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const res = await reportingApi.getScheduledConfigs(selectedStoreId);
      setConfigs(res.data);
    } catch {
      setAlertMsg({ text: t('Failed to load scheduled report configurations.'), severity: 'error' });
    } finally {
      setLoadingConfigs(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await reportingApi.getScheduledLogs(undefined, 30);
      setLogs(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingConfigId(null);
    setName('');
    setReportType('ALL_COMBINED');
    setFrequency('DAILY');
    setDayOfWeek('MONDAY');
    setDispatchTime('08:00');
    setStoreId(selectedStoreId || '');
    setTargetRole('MANAGER');
    setCustomEmails('');
    setRecipientPreview(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (cfg: ScheduledReportConfig) => {
    setEditingConfigId(cfg.id);
    setName(cfg.name);
    setReportType(cfg.reportType);
    setFrequency(cfg.frequency);
    setDayOfWeek(cfg.dayOfWeek || 'MONDAY');
    setDispatchTime(cfg.dispatchTime || '08:00');
    setStoreId(cfg.storeId || '');
    setTargetRole(cfg.targetRole || 'MANAGER');
    setCustomEmails(cfg.customRecipientEmails || '');
    setRecipientPreview(null);
    setFormOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!name.trim()) {
      setAlertMsg({ text: t('Please enter a schedule name.'), severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<ScheduledReportConfig> = {
        name: name.trim(),
        reportType,
        frequency,
        dayOfWeek: frequency === 'WEEKLY' ? dayOfWeek : null,
        dispatchTime,
        storeId: storeId || null,
        targetRole,
        customRecipientEmails: customEmails.trim() || null,
        enabled: true,
      };

      if (editingConfigId) {
        await reportingApi.updateScheduledConfig(editingConfigId, payload);
        setAlertMsg({ text: t('Scheduled report updated successfully.'), severity: 'success' });
      } else {
        await reportingApi.createScheduledConfig(payload);
        setAlertMsg({ text: t('New scheduled report configured.'), severity: 'success' });
      }
      setFormOpen(false);
      loadConfigs();
    } catch {
      setAlertMsg({ text: t('Failed to save scheduled report configuration.'), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (!window.confirm(t('Are you sure you want to delete this scheduled report?'))) return;
    try {
      await reportingApi.deleteScheduledConfig(id);
      setAlertMsg({ text: t('Scheduled report deleted.'), severity: 'info' });
      loadConfigs();
    } catch {
      setAlertMsg({ text: t('Failed to delete configuration.'), severity: 'error' });
    }
  };

  const handleTriggerNow = async (id: string, configName: string) => {
    setTriggeringId(id);
    setAlertMsg(null);
    try {
      const res = await reportingApi.triggerScheduledReport(id);
      setAlertMsg({
        text: `${configName}: ${res.data.message} (${res.data.durationMs} ms)`,
        severity: 'success',
      });
      loadConfigs();
      loadLogs();
    } catch {
      setAlertMsg({ text: t('Failed to dispatch scheduled report digest.'), severity: 'error' });
    } finally {
      setTriggeringId(null);
    }
  };

  const handlePreviewRecipients = async () => {
    setPreviewLoading(true);
    try {
      const res = await reportingApi.previewRecipients(storeId || undefined, targetRole, customEmails);
      setRecipientPreview(res.data);
    } catch {
      setAlertMsg({ text: t('Failed to resolve preview recipients.'), severity: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadServerExcel = async (type: 'aging' | 'stock') => {
    try {
      let blob: Blob;
      let filename: string;
      const today = new Date().toISOString().substring(0, 10).replace(/-/g, '');

      if (type === 'aging') {
        blob = await reportingApi.downloadFinancialAgingXlsx(selectedStoreId);
        filename = `financial_aging_report_${today}.xlsx`;
      } else {
        blob = await reportingApi.downloadStockBalanceXlsx(selectedStoreId);
        filename = `stock_balance_report_${today}.xlsx`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setAlertMsg({ text: t('Failed to download Excel workbook.'), severity: 'error' });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a8a', color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ScheduleIcon />
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {t('Automated Scheduled Reports & Email Digest (G.9)')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {t('Automated daily & weekly Excel (.xlsx) financial aging and stock balance reports dispatched to store managers')}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {alertMsg && (
            <Alert severity={alertMsg.severity} sx={{ mb: 2 }} onClose={() => setAlertMsg(null)}>
              {alertMsg.text}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label={t('Active Digest Schedules')} icon={<ScheduleIcon />} iconPosition="start" />
              <Tab label={t('Execution Audit Log')} icon={<HistoryIcon />} iconPosition="start" />
            </Tabs>

            {activeTab === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{ backgroundColor: '#2563eb' }}
              >
                {t('New Digest Schedule')}
              </Button>
            )}
          </Box>

          {/* TAB 0: Active Digest Schedules */}
          {activeTab === 0 && (
            <Box>
              {loadingConfigs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : configs.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', backgroundColor: '#f8fafc' }}>
                  <Typography variant="body1" color="text.secondary">
                    {t('No scheduled report configurations found.')}
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{t('Digest Name')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('Report Type')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('Frequency & Time')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('Target Scope & Role')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('Last Run')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{t('Actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {configs.map((cfg) => (
                        <TableRow key={cfg.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {cfg.name}
                            </Typography>
                            {cfg.customRecipientEmails && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                + {cfg.customRecipientEmails}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={
                                cfg.reportType === 'ALL_COMBINED'
                                  ? t('All (Aging + Stock)')
                                  : cfg.reportType === 'FINANCIAL_AGING'
                                  ? t('Financial Aging')
                                  : t('Stock Balance')
                              }
                              size="small"
                              color={cfg.reportType === 'ALL_COMBINED' ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={cfg.frequency === 'DAILY' ? t('Daily') : `${t('Weekly')} (${cfg.dayOfWeek || 'MON'})`}
                                size="small"
                                color="info"
                              />
                              <Typography variant="body2">{cfg.dispatchTime}</Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">
                              {cfg.storeName || t('Company Wide (All Stores)')}
                            </Typography>
                            <Typography variant="caption" color="primary">
                              Role: {cfg.targetRole}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {cfg.lastRunAt ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {cfg.lastStatus === 'SUCCESS' ? (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                ) : (
                                  <ErrorIcon color="error" fontSize="small" />
                                )}
                                <Typography variant="caption">
                                  {new Date(cfg.lastRunAt).toLocaleDateString()} {new Date(cfg.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                {t('Never')}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={triggeringId === cfg.id ? <CircularProgress size={14} color="inherit" /> : <SendIcon fontSize="small" />}
                                disabled={triggeringId === cfg.id}
                                onClick={() => handleTriggerNow(cfg.id, cfg.name)}
                              >
                                {t('Send Now')}
                              </Button>
                              <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cfg)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDeleteConfig(cfg.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* TAB 1: Execution Audit Log */}
          {activeTab === 1 && (
            <Box>
              {loadingLogs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : logs.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', backgroundColor: '#f8fafc' }}>
                  <Typography variant="body1" color="text.secondary">
                    {t('No execution logs found yet.')}
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{t('Dispatched At')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('Configuration')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('Status')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('Recipients Dispatched')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('Attachments Generated')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{t('Duration')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(log.executedAt).toLocaleString()}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {log.configName}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={log.status}
                              size="small"
                              color={log.status === 'SUCCESS' ? 'success' : 'error'}
                              icon={log.status === 'SUCCESS' ? <CheckCircleIcon /> : <ErrorIcon />}
                            />
                          </TableCell>

                          <TableCell>
                            <Tooltip title={log.recipientEmails || ''}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                                <PeopleIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {log.recipientsCount} {t('recipients')}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>

                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {log.attachmentsGenerated || '-'}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="caption">
                              {log.durationMs} ms
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Direct Server .xlsx Downloads Section */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('Server-Side Excel (.xlsx) Direct Exports')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('Instantly generate and download the exact enterprise multi-sheet workbooks dispatched in the email digests')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadServerExcel('aging')}
              >
                {t('Financial Aging (.xlsx)')}
              </Button>
              <Button
                variant="outlined"
                color="info"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadServerExcel('stock')}
              >
                {t('Stock Balance (.xlsx)')}
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, backgroundColor: '#f8fafc' }}>
          <Button onClick={onClose} variant="outlined">
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CREATE / EDIT SCHEDULE FORM MODAL */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingConfigId ? t('Edit Digest Schedule') : t('Create Automated Digest Schedule')}
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label={t('Schedule Name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            placeholder="e.g. Daily Branch Operations Digest"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t('Report Type')}</InputLabel>
              <Select
                value={reportType}
                label={t('Report Type')}
                onChange={(e) => setReportType(e.target.value as ScheduledReportType)}
              >
                <MenuItem value="ALL_COMBINED">{t('All Combined (Aging + Stock)')}</MenuItem>
                <MenuItem value="FINANCIAL_AGING">{t('Financial Aging & Overdue')}</MenuItem>
                <MenuItem value="STOCK_BALANCE">{t('Stock Balance & Units')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('Frequency')}</InputLabel>
              <Select
                value={frequency}
                label={t('Frequency')}
                onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
              >
                <MenuItem value="DAILY">{t('Daily')}</MenuItem>
                <MenuItem value="WEEKLY">{t('Weekly')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {frequency === 'WEEKLY' ? (
              <FormControl fullWidth>
                <InputLabel>{t('Day of Week')}</InputLabel>
                <Select
                  value={dayOfWeek}
                  label={t('Day of Week')}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                >
                  <MenuItem value="MONDAY">{t('Monday')}</MenuItem>
                  <MenuItem value="TUESDAY">{t('Tuesday')}</MenuItem>
                  <MenuItem value="WEDNESDAY">{t('Wednesday')}</MenuItem>
                  <MenuItem value="THURSDAY">{t('Thursday')}</MenuItem>
                  <MenuItem value="FRIDAY">{t('Friday')}</MenuItem>
                  <MenuItem value="SATURDAY">{t('Saturday')}</MenuItem>
                  <MenuItem value="SUNDAY">{t('Sunday')}</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Box />
            )}

            <TextField
              label={t('Dispatch Time (HH:mm)')}
              value={dispatchTime}
              onChange={(e) => setDispatchTime(e.target.value)}
              fullWidth
              placeholder="08:00"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t('Store Scope')}</InputLabel>
              <Select
                value={storeId}
                label={t('Store Scope')}
                onChange={(e) => setStoreId(e.target.value)}
              >
                <MenuItem value="">{t('Company Wide (All Stores)')}</MenuItem>
                {stores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('Target Role')}</InputLabel>
              <Select
                value={targetRole}
                label={t('Target Role')}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <MenuItem value="MANAGER">{t('Store Manager (MANAGER)')}</MenuItem>
                <MenuItem value="OWNER">{t('Owner / Executive')}</MenuItem>
                <MenuItem value="ADMIN">{t('Office Admin')}</MenuItem>
                <MenuItem value="AR">{t('Accounts Receivable (AR)')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label={t('Additional Recipient Emails')}
            value={customEmails}
            onChange={(e) => setCustomEmails(e.target.value)}
            fullWidth
            helperText={t('Comma-separated email addresses (e.g. regional.gm@smsmart.co.id, auditor@external.com)')}
            placeholder="operations@smsmart.co.id, audit@smsmart.co.id"
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={previewLoading ? <CircularProgress size={14} /> : <PeopleIcon />}
              onClick={handlePreviewRecipients}
              disabled={previewLoading}
            >
              {t('Preview Resolved Recipients')}
            </Button>
          </Box>

          {recipientPreview && (
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f8fafc' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                {recipientPreview.count} {t('Recipient(s) Resolved for')} {recipientPreview.storeName}:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: '0.85rem' }}>
                {recipientPreview.emails.map((email, idx) => (
                  <li key={idx}>
                    <strong>{email}</strong>
                  </li>
                ))}
              </Box>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFormOpen(false)}>{t('Cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSaveConfig}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {t('Save Schedule')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
