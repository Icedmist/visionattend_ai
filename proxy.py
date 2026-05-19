import socket
import select
import threading

def handle_client(client_socket):
    try:
        request = client_socket.recv(4096)
        if not request:
            return
        request_str = request.decode('utf-8', errors='ignore')
        lines = request_str.split('\r\n')
        if not lines:
            return
        parts = lines[0].split(' ')
        if len(parts) < 2:
            return
        method, target = parts[0], parts[1]
        
        if method == 'CONNECT':
            if ':' in target:
                host, port = target.split(':')
                port = int(port)
            else:
                host, port = target, 443
                
            dest_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            dest_socket.connect((host, port))
            client_socket.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
            
            sockets = [client_socket, dest_socket]
            keep_running = True
            while keep_running:
                readable, _, _ = select.select(sockets, [], [], 10)
                for s in readable:
                    other = dest_socket if s is client_socket else client_socket
                    try:
                        data = s.recv(8192)
                        if not data:
                            keep_running = False
                            break
                        other.sendall(data)
                    except Exception:
                        keep_running = False
                        break
        else:
            # Simple HTTP GET forwarder
            if target.startswith('http://'):
                url_parts = target[7:].split('/', 1)
                host = url_parts[0]
                path = '/' + url_parts[1] if len(url_parts) > 1 else '/'
            else:
                host = target
                path = '/'
            
            if ':' in host:
                host, port = host.split(':')
                port = int(port)
            else:
                port = 80
                
            dest_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            dest_socket.connect((host, port))
            dest_socket.sendall(request)
            
            sockets = [client_socket, dest_socket]
            keep_running = True
            while keep_running:
                readable, _, _ = select.select(sockets, [], [], 10)
                for s in readable:
                    other = dest_socket if s is client_socket else client_socket
                    try:
                        data = s.recv(8192)
                        if not data:
                            keep_running = False
                            break
                        other.sendall(data)
                    except Exception:
                        keep_running = False
                        break
    except Exception:
        pass
    finally:
        try:
            client_socket.close()
        except Exception:
            pass

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('127.0.0.1', 8080))
    server.listen(100)
    print("Local Python Proxy running on 127.0.0.1:8080")
    while True:
        try:
            client_socket, _ = server.accept()
            t = threading.Thread(target=handle_client, args=(client_socket,))
            t.daemon = True
            t.start()
        except KeyboardInterrupt:
            break
        except Exception:
            pass

if __name__ == '__main__':
    main()
