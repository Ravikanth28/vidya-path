const { globalTestSubmitSchema } = require('./middleware/validation');
const { z } = require('zod');

const validBody = {
    studentId: "student123",
    answers: {
        "q1": "SELECT * FROM users",
        "q2": "A"
    },
    timeSpent: 120,
    tabSwitches: 1,
    selectedLanguages: {
        "q1": "SQL"
    }
};

const result = globalTestSubmitSchema.safeParse(validBody);
if (result.success) {
    console.log("Validation successful");
    console.log(JSON.stringify(result.data, null, 2));
} else {
    console.log("Validation failed");
    console.log(JSON.stringify(result.error.errors, null, 2));
}

const arrayBody = {
    studentId: "student123",
    answers: [
        { questionId: "q1", selectedOption: "A" }
    ],
    timeTaken: 100
};

const result2 = globalTestSubmitSchema.safeParse(arrayBody);
if (result2.success) {
    console.log("\nValidation (array) successful");
} else {
    console.log("\nValidation (array) failed");
}
