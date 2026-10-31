package com.sms.storefront.controller;

import com.sms.storefront.dto.StorefrontOrderDto;
import com.sms.storefront.service.StorefrontCheckoutService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/storefront/orders")
@RequiredArgsConstructor
public class StorefrontOrderController {

    private final StorefrontCheckoutService checkoutService;

    @GetMapping
    public List<StorefrontOrderDto> listOrders(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {
        return checkoutService.listOrders(email, phone);
    }

    @GetMapping("/{id}")
    public StorefrontOrderDto getOrder(@PathVariable UUID id) {
        return checkoutService.getOrder(id);
    }

    @GetMapping("/number/{number}")
    public StorefrontOrderDto getOrderByNumber(@PathVariable String number) {
        return checkoutService.getOrderByNumber(number);
    }

    @PostMapping("/{id}/pay")
    public StorefrontOrderDto simulatePayment(@PathVariable UUID id) {
        return checkoutService.simulatePayment(id);
    }
}

