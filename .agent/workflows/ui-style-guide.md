---
description: Styling and Documentation
---

• Tailwind Consistency: Use Tailwind CSS for all styling. Avoid inline styles unless strictly necessary for dynamic values.
• Accessibility: Every interactive element must include proper ARIA labels and alt text for images.
• Self-Documentation: All exported functions and components must have JSDoc comments explaining their purpose and parameters.
3. Reliability and Safety (safety-contract.md)
• Stop and Ask: If API credentials, environment variables, or specific architectural decisions are missing, the agent must stop and request clarification rather than guessing.
• Secret Masking: Never commit or hardcode secrets. Ensure the agent uses .env.local for sensitive keys.