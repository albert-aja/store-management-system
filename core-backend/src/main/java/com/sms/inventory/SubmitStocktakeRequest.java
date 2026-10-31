package com.sms.inventory;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SubmitStocktakeRequest(@NotNull List<String> countedSerials) {
}
