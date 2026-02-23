#!/bin/bash
# Build script for Render.com
# Installs Node, builds React, then installs Python deps

# Install Node dependencies and build React
cd frontend
npm install
npm run build
cd ..

# Install Python dependencies
pip install -r backend/requirements.txt
