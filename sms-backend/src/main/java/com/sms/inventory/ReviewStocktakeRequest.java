package com.sms.inventory;

import jakarta.validation.constraints.Size;

public record ReviewStocktakeRequest(boolean approve, @Size(max = 500) String comment) {
}
