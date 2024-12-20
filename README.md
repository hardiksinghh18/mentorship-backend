# Mentorship Platform

A full-stack mentorship platform that allows users to connect as mentors and mentees, discover profiles, and manage mentorship connections. This project is built with a React frontend and a backend using Express.js and MySQL.

## Features

- **User Registration and Login**: Secure authentication with input validation.
- **Profile Setup**: Users can create and edit their profiles, specifying roles (mentor/mentee), skills, interests, and bio.
- **User Discovery**: Browse and filter profiles by role, skills, and interests.
- **Connection Requests**: Send, accept, decline, and manage mentorship requests.

## Tech Stack

### Frontend
- **React**: For building the UI.
- **React Router**: For navigation.
- **Redux with Thunk**: For state management.
- **Axios**: For API requests.
- **React Toastify**: For notifications.
- **Tailwind CSS**: For styling.

### Backend
- **Express.js**: REST API server.
- **MySQL**: Relational database.

## Prerequisites

- **Node.js**: >= 14.x
- **npm**: >= 6.x
- **MySQL**: Installed and running

## Frontend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/hardiksinghh18/mentorship-platform.git
   cd mentorship-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the backend URL in the `.env` file:
   ```env
   REACT_APP_BACKEND_BASE_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Backend Setup

Refer to the backend repository for setup instructions.

## Key Scripts

- **`npm run dev`**: Start the development server.
- **`npm run build`**: Build the application for production.
- **`npm run test`**: Run tests.



## Contributing

Contributions are welcome! Please submit issues or pull requests on the [GitHub repository](https://github.com/hardiksinghh18/mentorship-platform).

## License

This project is licensed under the MIT License.
