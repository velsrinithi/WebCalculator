
"use strict";

/* =========================================
   NEON WEB CALCULATOR
   JavaScript functionality
   ========================================= */

const keypad = document.getElementById("keypad");
const expressionDisplay = document.getElementById("expression");
const resultDisplay = document.getElementById("result");
const statusDisplay = document.getElementById("status");
const messageDisplay = document.getElementById("message");

/* Calculator state */

let currentInput = "0";
let previousValue = null;
let selectedOperator = null;
let waitingForOperand = false;
let expressionText = "";
let justCalculated = false;

/* =========================================
   1. REQUIRED ARITHMETIC FUNCTIONS
   ========================================= */

function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    if (b === 0) {
        throw new Error("Cannot divide by zero.");
    }

    return a / b;
}

/* Select and perform the required operation */

function calculate(a, operator, b) {
    switch (operator) {
        case "+":
            return add(a, b);

        case "-":
            return subtract(a, b);

        case "*":
            return multiply(a, b);

        case "/":
            return divide(a, b);

        default:
            throw new Error("Invalid mathematical operator.");
    }
}

/* Format results and avoid floating-point noise */

function normalizeNumber(number) {
    if (!Number.isFinite(number)) {
        throw new Error("Result is outside the supported range.");
    }

    return Number(number.toPrecision(12));
}

function formatNumber(number) {
    return String(normalizeNumber(number));
}

/* =========================================
   2. DISPLAY AND MESSAGES
   ========================================= */

function updateDisplay() {
    expressionDisplay.textContent =
        expressionText || currentInput;

    resultDisplay.textContent = currentInput;

    if (selectedOperator !== null) {
        statusDisplay.textContent = "OPERATOR SELECTED";
    } else if (justCalculated) {
        statusDisplay.textContent = "RESULT READY";
    } else {
        statusDisplay.textContent = "READY";
    }
}

function showMessage(message, isError = false) {
    messageDisplay.textContent = message;
    messageDisplay.classList.toggle("error", isError);
}

function resetCalculator() {
    currentInput = "0";
    previousValue = null;
    selectedOperator = null;
    waitingForOperand = false;
    expressionText = "";
    justCalculated = false;

    updateDisplay();
    showMessage("Calculator cleared. Ready when you are.");
}

/* =========================================
   3. NUMBER AND DECIMAL INPUT
   ========================================= */

function enterDigit(digit) {
    if (!/^[0-9]$/.test(digit)) {
        return;
    }

    if (waitingForOperand || justCalculated) {
        currentInput = digit;
        waitingForOperand = false;
        justCalculated = false;
    } else if (currentInput === "0") {
        currentInput = digit;
    } else if (currentInput === "-0") {
        currentInput = "-" + digit;
    } else if (currentInput.replace("-", "").length < 15) {
        currentInput += digit;
    } else {
        showMessage("Maximum digit length reached.", true);
        return;
    }

    expressionText = currentInput;
    updateDisplay();
    showMessage("Number entered.");
}

function enterDecimal() {
    if (waitingForOperand || justCalculated) {
        currentInput = "0.";
        waitingForOperand = false;
        justCalculated = false;
    } else if (!currentInput.includes(".")) {
        currentInput += ".";
    } else {
        return;
    }

    expressionText = currentInput;
    updateDisplay();
    showMessage("Decimal point entered.");
}

/* Change positive numbers to negative and vice versa */

function changeSign() {
    if (waitingForOperand || justCalculated) {
        waitingForOperand = false;
        justCalculated = false;
    }

    if (currentInput.startsWith("-")) {
        currentInput = currentInput.slice(1);
    } else if (currentInput !== "0") {
        currentInput = "-" + currentInput;
    }

    expressionText = currentInput;
    updateDisplay();
    showMessage("Number sign changed.");
}

/* Delete the last entered digit */

function backspace() {
    if (waitingForOperand || justCalculated) {
        return;
    }

    currentInput = currentInput.slice(0, -1);

    if (currentInput === "" || currentInput === "-") {
        currentInput = "0";
    }

    expressionText = currentInput;
    updateDisplay();
    showMessage("Last digit removed.");
}

/* =========================================
   4. OPERATOR SELECTION AND CALCULATION
   ========================================= */

function chooseOperator(operator) {
    if (!["+", "-", "*", "/"].includes(operator)) {
        return;
    }

    const symbols = {
        "+": "+",
        "-": "−",
        "*": "×",
        "/": "÷"
    };

    /*
     * If the user selects another operator before
     * entering the next number, replace the operator.
     */
    if (selectedOperator !== null && waitingForOperand) {
        selectedOperator = operator;

        expressionText =
            `${formatNumber(previousValue)} ${symbols[operator]}`;

        updateDisplay();
        showMessage("Operator changed.");
        return;
    }

    /*
     * Complete the pending calculation when chaining
     * operations such as 10 + 5 * 2.
     */
    if (selectedOperator !== null && !waitingForOperand) {
        performCalculation();

        // Stop if the previous calculation failed.
        if (!justCalculated) {
            return;
        }
    }

    previousValue = Number(currentInput);
    selectedOperator = operator;
    waitingForOperand = true;
    justCalculated = false;

    expressionText =
        `${formatNumber(previousValue)} ${symbols[operator]}`;

    updateDisplay();
    showMessage("Enter the next number.");
}

function performCalculation() {
    if (selectedOperator === null || previousValue === null) {
        showMessage("Enter a number and select an operator.");
        return;
    }

    if (waitingForOperand) {
        showMessage("Enter the second number first.", true);
        return;
    }

    const firstNumber = previousValue;
    const secondNumber = Number(currentInput);
    const operator = selectedOperator;

    const symbols = {
        "+": "+",
        "-": "−",
        "*": "×",
        "/": "÷"
    };

    try {
        const result = normalizeNumber(
            calculate(firstNumber, operator, secondNumber)
        );

        expressionText =
            `${formatNumber(firstNumber)} ${symbols[operator]} ` +
            `${formatNumber(secondNumber)} =`;

        currentInput = formatNumber(result);

        previousValue = null;
        selectedOperator = null;
        waitingForOperand = false;
        justCalculated = true;

        updateDisplay();
        showMessage("Calculation completed successfully.");
    } catch (error) {
        currentInput = "0";
        previousValue = null;
        selectedOperator = null;
        waitingForOperand = false;
        justCalculated = false;

        updateDisplay();
        showMessage(error.message, true);
    }
}

/* =========================================
   5. MOUSE AND BUTTON INTERACTIONS
   ========================================= */

keypad.addEventListener("click", function (event) {
    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    if (button.dataset.digit !== undefined) {
        enterDigit(button.dataset.digit);
        return;
    }

    if (button.dataset.operator) {
        chooseOperator(button.dataset.operator);
        return;
    }

    switch (button.dataset.action) {
        case "clear":
            resetCalculator();
            break;

        case "backspace":
            backspace();
            break;

        case "decimal":
            enterDecimal();
            break;

        case "sign":
            changeSign();
            break;

        case "equals":
            performCalculation();
            break;
    }
});

/* =========================================
   6. KEYBOARD SUPPORT
   ========================================= */

document.addEventListener("keydown", function (event) {
    /*
     * Ignore keyboard events originating from text
     * inputs so normal typing is not interrupted.
     */
    if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target.isContentEditable
    ) {
        return;
    }

    const key = event.key;

    if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        enterDigit(key);
    } else if (key === ".") {
        event.preventDefault();
        enterDecimal();
    } else if (["+", "-", "*", "/"].includes(key)) {
        event.preventDefault();
        chooseOperator(key);
    } else if (key === "x" || key === "X") {
        event.preventDefault();
        chooseOperator("*");
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        performCalculation();
    } else if (key === "Backspace") {
        event.preventDefault();
        backspace();
    } else if (key === "Escape" || key === "Delete") {
        event.preventDefault();
        resetCalculator();
    }
});

/* Initialize the calculator when the page loads */

updateDisplay();
