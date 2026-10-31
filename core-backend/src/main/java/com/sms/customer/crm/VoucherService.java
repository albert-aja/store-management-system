package com.sms.customer.crm;

import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.customer.Customer;
import com.sms.customer.CustomerRepository;
import com.sms.customer.crm.dto.VoucherRequest;
import com.sms.customer.crm.dto.VoucherResponse;
import com.sms.customer.crm.dto.VoucherValidationResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class VoucherService {

    private final StoreVoucherRepository voucherRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public List<VoucherResponse> listVouchers(Boolean activeOnly) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return voucherRepository.findByActiveTrueOrderByValidUntilAsc().stream()
                    .map(VoucherResponse::from).toList();
        }
        return voucherRepository.findAll().stream()
                .map(VoucherResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> listCustomerVouchers(UUID customerId) {
        return voucherRepository.findByAssignedCustomerIdOrderByValidUntilAsc(customerId).stream()
                .map(VoucherResponse::from).toList();
    }

    public VoucherResponse createVoucher(VoucherRequest request) {
        String code = request.code().trim().toUpperCase();
        if (voucherRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new ConflictException("Voucher code already exists: " + code);
        }

        Customer customer = null;
        if (request.assignedCustomerId() != null) {
            customer = customerRepository.findById(request.assignedCustomerId())
                    .orElseThrow(() -> new NotFoundException("Customer not found: " + request.assignedCustomerId()));
        }

        StoreVoucher voucher = new StoreVoucher();
        voucher.setCode(code);
        voucher.setTitle(request.title());
        voucher.setVoucherType(request.voucherType());
        voucher.setDiscountValue(request.discountValue());
        voucher.setMinOrderAmount(request.minOrderAmount());
        voucher.setMaxDiscountAmount(request.maxDiscountAmount());
        voucher.setValidFrom(request.validFrom());
        voucher.setValidUntil(request.validUntil());
        voucher.setMaxUses(request.maxUses() > 0 ? request.maxUses() : 1);
        voucher.setActive(true);
        voucher.setAssignedCustomer(customer);
        voucher.setNotes(request.notes());

        return VoucherResponse.from(voucherRepository.save(voucher));
    }

    @Transactional(readOnly = true)
    public VoucherValidationResponse validateVoucher(String code, BigDecimal orderAmount, UUID customerId) {
        if (code == null || code.isBlank()) {
            return new VoucherValidationResponse(false, "Voucher code cannot be blank", null, BigDecimal.ZERO, orderAmount);
        }

        Optional<StoreVoucher> opt = voucherRepository.findByCodeIgnoreCase(code.trim());
        if (opt.isEmpty()) {
            return new VoucherValidationResponse(false, "Kode voucher tidak ditemukan", code, BigDecimal.ZERO, orderAmount);
        }

        StoreVoucher v = opt.get();
        LocalDate now = LocalDate.now();

        if (!v.isActive()) {
            return new VoucherValidationResponse(false, "Voucher saat ini tidak aktif", code, BigDecimal.ZERO, orderAmount);
        }
        if (now.isBefore(v.getValidFrom())) {
            return new VoucherValidationResponse(false, "Voucher belum dapat digunakan (Berlaku mulai: " + v.getValidFrom() + ")", code, BigDecimal.ZERO, orderAmount);
        }
        if (now.isAfter(v.getValidUntil())) {
            return new VoucherValidationResponse(false, "Voucher telah kedaluwarsa (Berakhir: " + v.getValidUntil() + ")", code, BigDecimal.ZERO, orderAmount);
        }
        if (v.getTimesUsed() >= v.getMaxUses()) {
            return new VoucherValidationResponse(false, "Batas pemakaian kuota voucher ini telah habis", code, BigDecimal.ZERO, orderAmount);
        }
        if (v.getAssignedCustomer() != null && (customerId == null || !v.getAssignedCustomer().getId().equals(customerId))) {
            return new VoucherValidationResponse(false, "Voucher ini khusus diberikan untuk pelanggan terpilih", code, BigDecimal.ZERO, orderAmount);
        }
        if (v.getMinOrderAmount() != null && orderAmount != null && orderAmount.compareTo(v.getMinOrderAmount()) < 0) {
            return new VoucherValidationResponse(false, "Minimum nilai pembelanjaan untuk voucher ini adalah Rp " + v.getMinOrderAmount(), code, BigDecimal.ZERO, orderAmount);
        }

        // Calculate discount
        BigDecimal discount = BigDecimal.ZERO;
        if (v.getVoucherType() == VoucherType.FIXED_AMOUNT) {
            discount = v.getDiscountValue();
        } else if (v.getVoucherType() == VoucherType.PERCENTAGE) {
            discount = orderAmount.multiply(v.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            if (v.getMaxDiscountAmount() != null && discount.compareTo(v.getMaxDiscountAmount()) > 0) {
                discount = v.getMaxDiscountAmount();
            }
        }

        if (orderAmount != null && discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }

        BigDecimal finalAmount = orderAmount != null ? orderAmount.subtract(discount) : BigDecimal.ZERO;
        return new VoucherValidationResponse(true, "Voucher berhasil diterapkan!", code, discount, finalAmount);
    }

    public void applyVoucherUsage(String code) {
        StoreVoucher v = voucherRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new NotFoundException("Voucher not found: " + code));
        v.setTimesUsed(v.getTimesUsed() + 1);
        if (v.getTimesUsed() >= v.getMaxUses()) {
            v.setActive(false);
        }
    }
}

