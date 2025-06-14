#!/bin/bash

# Backend Project Structure Setup Script
# Run this script from your backend directory

echo "Creating backend project structure..."

# Create directories
mkdir -p src/config
mkdir -p src/controllers
mkdir -p src/middleware
mkdir -p src/models
mkdir -p src/routes
mkdir -p src/types
mkdir -p src/utils

# Create config files
touch src/config/database.ts
touch src/config/config.ts

# Create controller files
touch src/controllers/auth.controller.ts
touch src/controllers/todo.controller.ts

# Create middleware files
touch src/middleware/auth.middleware.ts
touch src/middleware/error.middleware.ts
touch src/middleware/validation.middleware.ts

# Create model files
touch src/models/user.model.ts
touch src/models/todo.model.ts

# Create route files
touch src/routes/auth.routes.ts
touch src/routes/todo.routes.ts

# Create types file
touch src/types/index.ts

# Create utility files
touch src/utils/jwt.utils.ts
touch src/utils/async.handler.ts

# Create main app file
touch src/app.ts

# Create root level files
touch package.json
touch tsconfig.json
touch .env.example
touch Dockerfile

echo "✅ Backend project structure created successfully!"
echo "📁 Directory structure:"
echo "backend/"
echo "├── src/"
echo "│   ├── config/"
echo "│   │   ├── database.ts"
echo "│   │   └── config.ts"
echo "│   ├── controllers/"
echo "│   │   ├── auth.controller.ts"
echo "│   │   └── todo.controller.ts"
echo "│   ├── middleware/"
echo "│   │   ├── auth.middleware.ts"
echo "│   │   ├── error.middleware.ts"
echo "│   │   └── validation.middleware.ts"
echo "│   ├── models/"
echo "│   │   ├── user.model.ts"
echo "│   │   └── todo.model.ts"
echo "│   ├── routes/"
echo "│   │   ├── auth.routes.ts"
echo "│   │   └── todo.routes.ts"
echo "│   ├── types/"
echo "│   │   └── index.ts"
echo "│   ├── utils/"
echo "│   │   ├── jwt.utils.ts"
echo "│   │   └── async.handler.ts"
echo "│   └── app.ts"
echo "├── package.json"
echo "├── tsconfig.json"
echo "├── .env.example"
echo "└── Dockerfile"