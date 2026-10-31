package com.sms.delivery;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record VerifyPackingRequest(@NotNull List<String> scannedSerials) {
}
