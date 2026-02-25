const { globalTestSubmitSchema } = require('./middleware/validation');
const { z } = require('zod');

console.log("globalTestSubmitSchema type:", typeof globalTestSubmitSchema);
if (globalTestSubmitSchema && globalTestSubmitSchema.safeParse) {
    console.log("safeParse exists");
} else {
    console.log("safeParse doesn't exist!");
}

const validBody = {
    studentId: "student123",
    answers: {
        "q1": "SELECT * FROM users"
    }
};

try {
    const result = globalTestSubmitSchema.safeParse(validBody);
    console.log("Success:", result.success);
} catch (e) {
    console.log("Error during safeParse:", e.message);
    console.log(e.stack);
}
