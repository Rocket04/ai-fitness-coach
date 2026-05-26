#!/usr/bin/env python3
import subprocess
import time
import sys
import socket
import json
import os
from pathlib import Path
from datetime import datetime

def is_server_ready(port, timeout=30):
    """Wait for server to be ready by polling the port."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                s.connect(('localhost', port))
                return True
        except (socket.error, ConnectionRefusedError):
            time.sleep(0.5)
    return False

def start_server(command, port, timeout=30):
    """Start a server and wait for it to be ready on the specified port."""
    print(f"Starting server: {command} (port {port})")
    process = subprocess.Popen(
        cmd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                s.connect(('localhost', port))
                return True
        except (socket.error, ConnectionRefusedError):
            time.sleep(0.5)
    raise RuntimeError(f"Server failed to start on port {port} within {timeout}s")

def run_command(command):
    """Run a command and return its exit code."""
    print(f"Running command: {' '.join(args)}")
    result = subprocess.run(args, capture_output=True, text=True)
    print(f"Command exit code: {result.returncode}")
    if result.stdout:
        print(f"STDOUT:\n{result.stdout}")
    if result.stderr:
        print(f"STDERR:\n{result.stderr}")
    return result.returncode

# Parse command line arguments
import argparse

parser = argparse.ArgumentParser(description='Run webapp testing with server management')
parser.add_argument('--server', action='append', dest='servers', required=True, help='Server command (can be repeated)')
parser.add_argument('--port', action='append', dest='ports', type=int, required=True, help='Port for each server (must match --server count)')
parser.add_argument('--timeout', type=int, default=30, help='Timeout in seconds per server (default: 30)')
parser.add_argument('command', nargs=argparse.REMAINDER, help='Command to run after server(s) ready')

args = parser.parse_args()

# Validate arguments
if len(args.servers) != len(args.ports):
    print("Error: Number of --server and --port arguments must match")
    sys.exit(1)

# Start all servers
server_processes = []
server_commands = []

try:
    # Start all servers
    for i, (cmd, port) in enumerate(zip(args.servers, args.ports)):
        server_processes.append(subprocess.Popen(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        ))
        print(f"Started server {i+1}: {cmd} on port {port}")
        server_commands.append((cmd, port))
    
    # Wait for all servers to be ready
    print("Waiting for servers to become ready...")
    all_ready = True
    for i, (server, port) in enumerate(zip(server_processes, args.ports)):
        print(f"Waiting for server {i+1} on port {port}...")
        start_time = time.time()
        while time.time() - start_time < args.timeout:
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(1)
                    s.connect(('localhost', port))
                    print(f"Server {i+1} on port {port} is ready")
                    break
            except (socket.error, ConnectionRefusedError):
                time.sleep(0.5)
        except Exception as e:
            print(f"Error checking server {i+1}: {e}")
            all_ready = False
    
    if not all_ready:
        print("Not all servers became ready in time")
        sys.exit(1)
    
    print(f"All {len(server_processes)} server(s) ready")
    
    # Run the main command
    if args.command:
        print(f"Running command: {' '.join(args.command)}")
        result = subprocess.run(args.command)
        sys.exit(result.returncode)
    
finally:
    # Clean up all servers
    print("Stopping servers...")
    for process in server_processes:
        try:
            process.terminate()
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
    print("All servers stopped")

if __name__ == '__main__':
    main()