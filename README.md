Design: figma.com/design/AXZTughs6bCHIN31SOiQsF/Untitled?t=u3M2k4EkgcV7N8bW-0

## Local development

The frontend uses the Axum API in the sibling `projekt-ertekelo-backend` folder. Start that service with its `.env` configured, then run:

```sh
npm install
npm run dev
```

The API defaults to `http://localhost:8080/api/v1`. To use a different address, define `VITE_API_URL` in the frontend environment (for example, `VITE_API_URL=http://localhost:8080/api/v1`). The backend requires MySQL and `JWT_SECRET`; SMTP settings are needed to deliver password-recovery codes.