# **App Name**: INEI Access Portal

## Core Features:

- User Authentication: Authenticate users against a backend REST API to grant access to the system based on roles (Administrator, PMO, Coordinator, Scrum Master, Developer, and User).
- Role-Based Redirection: Redirect the user to the appropriate dashboard based on their assigned role upon successful login. Call the nestjs api and validate that role with what the api returned to ensure it is not spoofed
- CAPTCHA Validation: Implement a CAPTCHA system to prevent bot logins and ensure security.
- Input validation: Validates all the text entry to ensure there is valid text entered to avoid sql injection attacks
- Session management: Once a user succesfully enters a CAPTCHA the session is stored for them as authenticated so they dont have to keep entering it

## Style Guidelines:

- Primary color: #018CD1 (a vibrant blue) for the main CTA button.
- Background color: #E8F2F7 (a very light blue) applied as a semitransparent overlay on the background image.
- Accent color: #004272 (a dark blue) for titles and input field borders, providing contrast.
- Body and headline font: 'PT Sans' (sans-serif) for clear and accessible text throughout the interface.
- The login form should be a card, centered on the right side of the screen.
- Display an image in the lower-left of the screen, with the login form taking the opposite side.
- Use a subtle hover animation effect on the 'Ingresar' button to indicate interactivity.