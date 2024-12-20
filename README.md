# Mentorship Platform - Backend

## Project Description
The backend of the Mentorship Platform is a RESTful API that facilitates user authentication, profile management, and mentorship connections. It is built using Node.js with Express.js and uses MySQL as the relational database. The application follows secure coding practices to ensure data protection and efficient API responses.

---

## Features
- **User Authentication**: Secure registration, login, and logout functionalities using JWT.
- **Profile Management**: APIs to create, edit, and delete user profiles.
- **Mentorship Connections**: Features to send, accept, or decline mentorship requests.
- **Role-Based Discovery**: Filters for mentors or mentees based on skills, interests, and more.

---

## Prerequisites
- Node.js (>=16.0)
- MySQL (>=8.0)
- npm (>=7.0)

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hardiksinghh18/mentorship-backend.git
   cd mentorship-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the environment variables:
   - Create a `.env` file in the root directory.
   - Refer to `.env.sample` for required variables and fill them with your details.

4. Run database migrations and seeders (if applicable):
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

5. Start the server:
   ```bash
   npm start
   ```

---

## Environment Variables
| Variable           | Description                             |
|--------------------|-----------------------------------------|
| `DB_NAME`          | Name of the database                   |
| `DB_USER`          | Database username                      |
| `DB_PASSWORD`      | Database password                      |
| `DB_HOST`          | Host address of the database server    |
| `DB_DIALECT`       | Database dialect (e.g., `mysql`)       |
| `JWT_SECRET`       | Secret key for signing JWT tokens      |
| `ACCESS_TOKEN_KEY` | Key for access tokens                  |
| `REFRESH_TOKEN_KEY`| Key for refresh tokens                 |
| `PORT`             | Port for the server                   |
| `FRONTEND_BASE_URL`| Base URL of the frontend application   |
| `NODE_ENV`         | Environment (e.g., `development`)      |

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Profile Management
- `GET /api/users/:username` - Fetch a user's profile by username
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user profile

### Mentorship Requests
- `POST /api/requests` - Send a mentorship request
- `GET /api/requests` - Fetch all mentorship requests
- `PUT /api/requests/:id` - Update request status (accept/decline)

### User Discovery
- `GET /api/users` - List users with filters for roles, skills, and interests

---

## Dependencies
| Package          | Description                                |
|------------------|--------------------------------------------|
| `bcryptjs`       | Password hashing                          |
| `body-parser`    | Parsing request bodies                   |
| `cookie-parser`  | Parse cookies for authentication tokens  |
| `cors`           | Enable Cross-Origin Resource Sharing     |
| `dotenv`         | Manage environment variables             |
| `express`        | Web framework for Node.js                |
| `jsonwebtoken`   | JSON Web Token implementation            |
| `mysql2`         | MySQL client for Node.js                 |
| `sequelize`      | ORM for relational databases             |

---

## Folder Structure
```
mentorship-backend/
├── controllers/       # API controllers
├── models/            # Database models
├── routes/            # API routes
├── migrations/        # Database migrations
├── seeders/           # Database seeders
├── config/            # Sequelize configuration
├── utils/             # Utility functions
├── index.js           # Entry point of the application
└── .env.sample        # Sample environment variables
```

---

## Contributing
1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes and push them to your fork:
   ```bash
   git commit -m "Add feature-name"
   git push origin feature-name
   ```
4. Create a Pull Request against the `main` branch.

---

## License
This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements
Special thanks to the open-source community for inspiring this project.
