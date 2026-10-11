import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import BuildIcon from '@mui/icons-material/Build';
import VerifiedIcon from '@mui/icons-material/Verified';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuthStore } from '../../store/authStore';
import { useStores } from '../stores/hooks';
import {
  useStockReturns,
  useCompleteReturn,
  useRecordDisposition,
  useWarrantyClaims,
  useDecideWarrantyClaim,
  useRepairTickets,
  useCompleteRepairTicket,
  useStockDisposals,
} from './hooks';
import type {
  StockReturn,
  WarrantyClaim,
  RepairTicket,
  ReturnDisposition,
  WarrantyCoverageDecision,
  RepairStatus,
  StockDisposal,
} from './types';

export default function RepossessionWarrantyPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [storeFilter, setStoreFilter] = useState('');

  const { data: stores = [] } = useStores();
  const selectedStoreId = storeFilter || (stores[0]?.id ?? '');

  // Returns
  const { data: returns = [] as StockReturn[], isLoading: loadingReturns } = useStockReturns(
    selectedStoreId || undefined
  );
  const completeReturnMutation = useCompleteReturn();
  const recordDispositionMutation = useRecordDisposition();

  // Warranty Claims
  const { data: warrantyClaims = [] as WarrantyClaim[], isLoading: loadingClaims } = useWarrantyClaims(
    selectedStoreId || undefined
  );
  const decideClaimMutation = useDecideWarrantyClaim();

  // Repair Tickets
  const { data: repairTickets = [] as RepairTicket[], isLoading: loadingRepairs } = useRepairTickets(
    selectedStoreId || undefined
  );
  const completeRepairMutation = useCompleteRepairTicket();

  // Disposals
  const { data: disposals = [] as StockDisposal[], isLoading: loadingDisposals } = useStockDisposals(
    selectedStoreId || undefined
  );

  // Dialog states
  const [completeReturnTarget, setCompleteReturnTarget] = useState<StockReturn | null>(null);
  const [recovered, setRecovered] = useState(true);
  const [refusalReason, setRefusalReason] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');

  const [dispositionTarget, setDispositionTarget] = useState<StockReturn | null>(null);
  const [selectedDisposition, setSelectedDisposition] = useState<ReturnDisposition>('SELL_AS_IS');
  const [conditionNotes, setConditionNotes] = useState('');

  const [claimTarget, setClaimTarget] = useState<WarrantyClaim | null>(null);
  const [coverageDecision, setCoverageDecision] = useState<WarrantyCoverageDecision>('COVERED_REPAIR');
  const [decisionNotes, setDecisionNotes] = useState('');

  const [repairTarget, setRepairTarget] = useState<RepairTicket | null>(null);
  const [repairFinalStatus, setRepairFinalStatus] = useState<RepairStatus>('REPAIRED');
  const [diagnosis, setDiagnosis] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [repairCost, setRepairCost] = useState('0');

  const currentEmployee = useAuthStore((s) => s.employee);

  const handleOpenCompleteReturn = (ret: StockReturn) => {
    setCompleteReturnTarget(ret);
    setRecovered(true);
    setRefusalReason('');
    setCompleteNotes('');
  };

  const handleConfirmCompleteReturn = async () => {
    if (!completeReturnTarget) return;
    await completeReturnMutation.mutateAsync({
      id: completeReturnTarget.id,
      payload: {
        recovered,
        refusalReason: !recovered ? refusalReason : undefined,
        notes: completeNotes,
      },
    });
    setCompleteReturnTarget(null);
  };

  const handleOpenDisposition = (ret: StockReturn) => {
    setDispositionTarget(ret);
    setSelectedDisposition('SELL_AS_IS');
    setConditionNotes('');
  };

  const handleConfirmDisposition = async () => {
    if (!dispositionTarget || !currentEmployee) return;
    await recordDispositionMutation.mutateAsync({
      id: dispositionTarget.id,
      payload: {
        disposition: selectedDisposition,
        inspectedById: currentEmployee.id,
        conditionNotes,
      },
    });
    setDispositionTarget(null);
  };

  const handleOpenDecideClaim = (claim: WarrantyClaim) => {
    setClaimTarget(claim);
    setCoverageDecision('COVERED_REPAIR');
    setDecisionNotes('');
  };

  const handleConfirmDecideClaim = async () => {
    if (!claimTarget) return;
    await decideClaimMutation.mutateAsync({
      id: claimTarget.id,
      payload: {
        decision: coverageDecision,
        decisionNotes,
      },
    });
    setClaimTarget(null);
  };

  const handleOpenCompleteRepair = (ticket: RepairTicket) => {
    setRepairTarget(ticket);
    setRepairFinalStatus('REPAIRED');
    setDiagnosis('');
    setActionTaken('');
    setRepairCost('0');
  };

  const handleConfirmCompleteRepair = async () => {
    if (!repairTarget) return;
    await completeRepairMutation.mutateAsync({
      id: repairTarget.id,
      payload: {
        status: repairFinalStatus,
        diagnosis,
        actionTaken,
        repairCost: parseFloat(repairCost) || 0,
      },
    });
    setRepairTarget(null);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Warranty, Returns & Disposal
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage customer returns, repossessions, warranty processing, repair tickets, and salvage disposals
          </Typography>
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="store-select-label">Store</InputLabel>
            <Select
              labelId="store-select-label"
              value={selectedStoreId}
              label="Store"
              onChange={(e) => setStoreFilter(e.target.value)}
            >
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<AssignmentReturnIcon />} iconPosition="start" label={`Returns & Repossessions (${returns.length})`} />
          <Tab icon={<VerifiedIcon />} iconPosition="start" label={`Warranty Claims (${warrantyClaims.length})`} />
          <Tab icon={<BuildIcon />} iconPosition="start" label={`Repair Tickets (${repairTickets.length})`} />
          <Tab icon={<DeleteSweepIcon />} iconPosition="start" label={`Scrap Disposals (${disposals.length})`} />
        </Tabs>

        <CardContent sx={{ p: 0 }}>
          {/* TAB 0: RETURNS & REPOSSESSIONS */}
          {activeTab === 0 && (
            <>
              {loadingReturns && <LinearProgress />}
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Return #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Serial / Item</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Disposition</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Scheduled Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {returns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No returns or repossession records found for this store.
                        </TableCell>
                      </TableRow>
                    ) : (
                      returns.map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{r.returnNumber}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={r.returnType === 'REPOSSESSION' ? 'Repossession' : 'Customer Return'}
                              color={r.returnType === 'REPOSSESSION' ? 'warning' : 'info'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{r.customerName || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {r.productVariantName || 'Item'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              SN: {r.manufacturerSerial || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={r.status}
                              color={
                                r.status === 'RECEIVED'
                                  ? 'success'
                                  : r.status === 'CANCELLED'
                                  ? 'error'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {r.disposition ? (
                              <Chip
                                size="small"
                                label={r.disposition.disposition.replace(/_/g, ' ')}
                                color="primary"
                              />
                            ) : (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Not inspected
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{r.scheduledDate || '-'}</TableCell>
                          <TableCell align="right">
                            {r.status === 'SCHEDULED' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handleOpenCompleteReturn(r)}
                                sx={{ mr: 1 }}
                              >
                                Inbound Complete
                              </Button>
                            )}
                            {r.status === 'RECEIVED' && !r.disposition && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="secondary"
                                onClick={() => handleOpenDisposition(r)}
                              >
                                Inspect & Dispose
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* TAB 1: WARRANTY CLAIMS */}
          {activeTab === 1 && (
            <>
              {loadingClaims && <LinearProgress />}
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Claim #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Serial / Item</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Distributor</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Defect Description</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Decision</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {warrantyClaims.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No warranty claims found for this store.
                        </TableCell>
                      </TableRow>
                    ) : (
                      warrantyClaims.map((c) => (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{c.claimNumber}</TableCell>
                          <TableCell>{c.customerName || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {c.productVariantName || 'Item'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              SN: {c.manufacturerSerial || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{c.distributorName || '-'}</TableCell>
                          <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.defectDescription || '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={c.coverageDecision.replace(/_/g, ' ')}
                              color={
                                c.coverageDecision === 'PENDING'
                                  ? 'default'
                                  : c.coverageDecision === 'REJECTED'
                                  ? 'error'
                                  : 'success'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={c.status} />
                          </TableCell>
                          <TableCell align="right">
                            {c.coverageDecision === 'PENDING' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenDecideClaim(c)}
                              >
                                Record Decision
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* TAB 2: REPAIR TICKETS */}
          {activeTab === 2 && (
            <>
              {loadingRepairs && <LinearProgress />}
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Ticket #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Serial / Item</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Vendor / Tech</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Problem</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Repair Cost</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {repairTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No repair tickets recorded for this store.
                        </TableCell>
                      </TableRow>
                    ) : (
                      repairTickets.map((t) => (
                        <TableRow key={t.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{t.ticketNumber}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {t.productVariantName || 'Item'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              SN: {t.manufacturerSerial || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{t.vendorName}</TableCell>
                          <TableCell>{t.problemDescription || '-'}</TableCell>
                          <TableCell>
                            {t.repairCost != null ? `IDR ${t.repairCost.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={t.status.replace(/_/g, ' ')}
                              color={
                                t.status === 'REPAIRED'
                                  ? 'success'
                                  : t.status === 'UNREPAIRABLE'
                                  ? 'error'
                                  : 'warning'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            {t.status === 'SENT_TO_VENDOR' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleOpenCompleteRepair(t)}
                              >
                                Complete Repair
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* TAB 3: SCRAP DISPOSALS */}
          {activeTab === 3 && (
            <>
              {loadingDisposals && <LinearProgress />}
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Disposal #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Serial / Item</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Buyer</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Proceeds (IDR)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Authorized By</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Disposed Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {disposals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No scrap disposal records found for this store.
                        </TableCell>
                      </TableRow>
                    ) : (
                      disposals.map((d) => (
                        <TableRow key={d.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{d.disposalNumber}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {d.productVariantName || 'Item'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              SN: {d.manufacturerSerial || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{d.reason}</TableCell>
                          <TableCell>{d.buyerName || '-'}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            IDR {(d.scrapProceeds || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>{d.authorizedByName}</TableCell>
                          <TableCell>
                            {d.disposedAt ? new Date(d.disposedAt).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Complete Return Dialog */}
      <Dialog open={Boolean(completeReturnTarget)} onClose={() => setCompleteReturnTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Return Inbound</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Confirm physical inbound reception for Return <strong>{completeReturnTarget?.returnNumber}</strong>.
            {completeReturnTarget?.returnType === 'REPOSSESSION' && (
              <Box component="span" sx={{ display: 'block', mt: 1, color: 'warning.main' }}>
                Note: Repossession settlement will automatically zero remaining installment balance.
              </Box>
            )}
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="recovery-status-label">Unit Status</InputLabel>
            <Select
              labelId="recovery-status-label"
              value={recovered ? 'recovered' : 'refused'}
              label="Unit Status"
              onChange={(e) => setRecovered(e.target.value === 'recovered')}
            >
              <MenuItem value="recovered">Successfully Recovered & Inbounded</MenuItem>
              <MenuItem value="refused">Customer Refusal / Not Recovered</MenuItem>
            </Select>
          </FormControl>
          {!recovered && (
            <TextField
              fullWidth
              size="small"
              label="Refusal Reason"
              value={refusalReason}
              onChange={(e) => setRefusalReason(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
          )}
          <TextField
            fullWidth
            size="small"
            label="Inbound / Condition Notes"
            multiline
            rows={2}
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteReturnTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmCompleteReturn}
            disabled={completeReturnMutation.isPending || (!recovered && !refusalReason.trim())}
          >
            Confirm Inbound
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Disposition Dialog */}
      <Dialog open={Boolean(dispositionTarget)} onClose={() => setDispositionTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Inspection & Disposition</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Inspecting Return <strong>{dispositionTarget?.returnNumber}</strong> (Serial: {dispositionTarget?.manufacturerSerial}).
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="disposition-label">Disposition Decision</InputLabel>
            <Select
              labelId="disposition-label"
              value={selectedDisposition}
              label="Disposition Decision"
              onChange={(e) => setSelectedDisposition(e.target.value as ReturnDisposition)}
            >
              <MenuItem value="SELL_AS_IS">Sell As-Is (Restores unit to available inventory)</MenuItem>
              <MenuItem value="REPAIR_THEN_SELL">Repair Then Sell (Initiates repair ticket)</MenuItem>
              <MenuItem value="SCRAP_DISPOSAL">Scrap Disposal (Marked for permanent salvage)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Technical Inspection Notes"
            multiline
            rows={3}
            value={conditionNotes}
            onChange={(e) => setConditionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDispositionTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmDisposition}
            disabled={recordDispositionMutation.isPending}
          >
            Record Disposition
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decide Warranty Claim Dialog */}
      <Dialog open={Boolean(claimTarget)} onClose={() => setClaimTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Distributor Warranty Decision</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Claim <strong>{claimTarget?.claimNumber}</strong> for {claimTarget?.productVariantName} (SN: {claimTarget?.manufacturerSerial}).
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="decision-label">Coverage Decision</InputLabel>
            <Select
              labelId="decision-label"
              value={coverageDecision}
              label="Coverage Decision"
              onChange={(e) => setCoverageDecision(e.target.value as WarrantyCoverageDecision)}
            >
              <MenuItem value="COVERED_REPAIR">Covered - Vendor Repair</MenuItem>
              <MenuItem value="COVERED_REPLACE">Covered - Unit Replacement</MenuItem>
              <MenuItem value="REJECTED">Warranty Rejected</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Decision Notes / Manufacturer Ref"
            multiline
            rows={3}
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmDecideClaim}
            disabled={decideClaimMutation.isPending}
          >
            Save Decision
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Repair Dialog */}
      <Dialog open={Boolean(repairTarget)} onClose={() => setRepairTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Repair Ticket</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Repair Ticket <strong>{repairTarget?.ticketNumber}</strong> ({repairTarget?.vendorName}).
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="repair-status-label">Final Status</InputLabel>
            <Select
              labelId="repair-status-label"
              value={repairFinalStatus}
              label="Final Status"
              onChange={(e) => setRepairFinalStatus(e.target.value as RepairStatus)}
            >
              <MenuItem value="REPAIRED">Repaired (Returns unit to Warehouse Available)</MenuItem>
              <MenuItem value="UNREPAIRABLE">Unrepairable (Scrap disposal needed)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Action Taken"
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Repair Cost (IDR)"
            type="number"
            value={repairCost}
            onChange={(e) => setRepairCost(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRepairTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmCompleteRepair}
            disabled={completeRepairMutation.isPending}
          >
            Complete Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
