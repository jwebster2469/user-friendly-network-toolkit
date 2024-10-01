import argparse
import textwrap
import os
import nmap
import scapy.all as scapy
import time
import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import plotly.graph_objs as go
import threading
import json
import geoip2.database
from dotenv import load_dotenv
import openai
import queue

# Load environment variables from .env file
load_dotenv()

# Get the OpenAI API key from environment variables
openai_api_key = os.getenv("OPENAI_API_KEY")

# Set the OpenAI API key
openai.api_key = openai_api_key

# Define a constant for export folder
EXPORT_FOLDER = "exports"

if not os.path.exists(EXPORT_FOLDER):
    os.makedirs(EXPORT_FOLDER)

class IntegratedNetworkAnalysisToolkit:
    def __init__(self):
        self.nm = nmap.PortScanner()
        self.geo_reader = geoip2.database.Reader('GeoLite2-City.mmdb')
        self.packet_queue = queue.Queue()
        self.stop_capture = threading.Event()
        self.capture_thread = None
        self.network_activity = []
        self.devices = []

    def scan_network(self):
        while True:
            self.nm.scan(hosts='192.168.1.0/24', arguments='-sn')
            self.devices = []
            for host in self.nm.all_hosts():
                if 'mac' in self.nm[host]['addresses']:
                    self.devices.append({
                        "ip": self.nm[host]['addresses']['ipv4'],
                        "mac": self.nm[host]['addresses']['mac'],
                        "vendor": self.nm[host]['vendor'].get(self.nm[host]['addresses']['mac'], 'Unknown')
                    })
            self.export_devices(self.devices)
            time.sleep(300)  # Wait for 5 minutes before the next scan

    def export_devices(self, devices):
        if not devices:
            print("No devices detected on the network during the scan.")
            export_file = os.path.join(EXPORT_FOLDER, f'no_devices_detected_{time.strftime("%Y%m%d_%H%M%S")}.json')
        else:
            export_file = os.path.join(EXPORT_FOLDER, f'devices_{time.strftime("%Y%m%d_%H%M%S")}.json')
        
        with open(export_file, 'w') as f:
            json.dump(devices, f, indent=4)
        print(f"Devices exported to {export_file}")

    def run_analysis(self, duration):
        packets = scapy.sniff(timeout=duration)
        return packets

    def start_packet_capture(self):
        self.stop_capture.clear()
        
        def capture_packets():
            while not self.stop_capture.is_set():
                sniffed_packet = scapy.sniff(count=1, timeout=1)
                if sniffed_packet:
                    self.packet_queue.put(sniffed_packet[0])

        self.capture_thread = threading.Thread(target=capture_packets)
        self.capture_thread.start()

    def stop_packet_capture(self):
        self.stop_capture.set()
        if self.capture_thread:
            self.capture_thread.join()

    def process_packets(self):
        while not self.packet_queue.empty():
            packet = self.packet_queue.get()
            self.analyze_packet(packet)
    
    def analyze_packet(self, packet):
        if packet.haslayer(scapy.IP):
            src_ip = packet[scapy.IP].src
            dst_ip = packet[scapy.IP].dst
            protocol = packet[scapy.IP].proto
            
            activity = f"Packet detected: {src_ip} -> {dst_ip}, Protocol: {protocol}"
            
            if packet.haslayer(scapy.TCP):
                src_port = packet[scapy.TCP].sport
                dst_port = packet[scapy.TCP].dport
                activity += f"\nTCP Packet - Source Port: {src_port}, Destination Port: {dst_port}"
            
            if packet.haslayer(scapy.UDP):
                src_port = packet[scapy.UDP].sport
                dst_port = packet[scapy.UDP].dport
                activity += f"\nUDP Packet - Source Port: {src_port}, Destination Port: {dst_port}"
            
            if packet.haslayer(scapy.TLS) or packet.haslayer(scapy.SSL):
                activity += "\nEncrypted traffic detected. Cannot decrypt."
            elif packet.haslayer(scapy.Raw):
                raw_data = packet[scapy.Raw].load
                activity += f"\nRaw packet data (human-readable): {raw_data.decode(errors='ignore')}"
            
            print(activity)
            self.network_activity.append({
                'time': time.time(),
                'src_ip': src_ip,
                'dst_ip': dst_ip,
                'activity': activity
            })

    def get_device_info(self, ip):
        for device in self.devices:
            if device['ip'] == ip:
                return device
        return None

class UserFriendlyNetworkToolkit:
    def __init__(self):
        self.toolkit = IntegratedNetworkAnalysisToolkit()

    def run(self):
        parser = argparse.ArgumentParser(
            description="User-Friendly Network Analysis Toolkit",
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog=textwrap.dedent('''
                Examples:
                  python3 user_friendly_toolkit.py --scan
                  python3 user_friendly_toolkit.py --monitor --duration 300
                  python3 user_friendly_toolkit.py --dashboard
                  python3 user_friendly_toolkit.py --help
            ''')
        )
        parser.add_argument('--scan', action='store_true', help='Perform a quick network scan continuously')
        parser.add_argument('--monitor', action='store_true', help='Start network monitoring')
        parser.add_argument('--duration', type=int, default=60, help='Duration of monitoring in seconds (default: 60)')
        parser.add_argument('--dashboard', action='store_true', help='Launch the network dashboard')
        parser.add_argument('--export', type=str, help='Export suspicious activity to a file')
        
        args = parser.parse_args()

        if args.scan:
            self.perform_network_scan()
        elif args.monitor:
            self.start_monitoring(args.duration, args.export)
        elif args.dashboard:
            self.launch_dashboard()
        else:
            parser.print_help()

    def perform_network_scan(self):
        print("Starting continuous network scan...")
        self.toolkit.scan_network()

    def start_monitoring(self, duration, export_file=None):
        print(f"Starting network monitoring for {duration} seconds...")
        self.toolkit.start_packet_capture()
        try:
            time.sleep(duration)
            self.toolkit.stop_packet_capture()
            if export_file:
                self.export_suspicious_activity(self.toolkit.network_activity, export_file)
            print("Monitoring complete. Suspicious activity identified and exported if specified.")
        except KeyboardInterrupt:
            print("Monitoring stopped by user.")
        finally:
            self.toolkit.stop_packet_capture()

    def export_suspicious_activity(self, suspicious_activity, export_file):
        export_file = os.path.join(EXPORT_FOLDER, f'suspicious_activity_{time.strftime("%Y%m%d_%H%M%S")}.json')
        with open(export_file, 'w') as f:
            json.dump(suspicious_activity, f, indent=4)
        print(f"Suspicious activity exported to {export_file}")

    def launch_dashboard(self):
        app = dash.Dash(__name__)

        app.layout = html.Div(
            style={'backgroundColor': '#1E1E1E', 'color': '#FFFFFF'},
            children=[
                html.H1('Network Activity Dashboard', style={'textAlign': 'center'}),
                dcc.Graph(id='network-activity-graph'),
                html.Div(id='network-activity-log'),
                html.Div(id='device-info'),
                dcc.Dropdown(
                    id='device-filter',
                    options=[{'label': 'All Devices', 'value': 'all'}],
                    value='all',
                    style={'backgroundColor': '#2E2E2E', 'color': '#000000'}
                ),
                dcc.Interval(id='graph-update', interval=1000),
            ]
        )

        @app.callback(
            [Output('network-activity-graph', 'figure'),
             Output('network-activity-log', 'children'),
             Output('device-info', 'children'),
             Output('device-filter', 'options')],
            [Input('graph-update', 'n_intervals'),
             Input('device-filter', 'value')]
        )
        def update_dashboard(_, selected_device):
            self.toolkit.process_packets()
            activity_data = self.toolkit.network_activity[-100:]  # Last 100 activities
            
            # Filter data based on selected device
            if selected_device != 'all':
                activity_data = [a for a in activity_data if a['src_ip'] == selected_device or a['dst_ip'] == selected_device]
            
            # Prepare data for the graph
            times = [a['time'] for a in activity_data]
            activities = [i for i in range(len(times))]
            
            figure = {
                'data': [go.Scatter(x=times, y=activities, mode='lines+markers')],
                'layout': {
                    'title': 'Live Network Activity',
                    'xaxis': {'title': 'Time'},
                    'yaxis': {'title': 'Activity'},
                    'plot_bgcolor': '#1E1E1E',
                    'paper_bgcolor': '#1E1E1E',
                    'font': {'color': '#FFFFFF'}
                }
            }
            
            # Prepare the log
            log_entries = [html.P(a['activity']) for a in reversed(activity_data[:10])]  # Last 10 activities
            
            # Prepare device info
            device_info = []
            for device in self.toolkit.devices:
                device_activity = [a for a in activity_data if a['src_ip'] == device['ip'] or a['dst_ip'] == device['ip']]
                device_info.append(html.Div([
                    html.H3(f"Device: {device['ip']} ({device['vendor']})"),
                    html.P(f"MAC Address: {device['mac']}"),
                    html.P(f"Activity Count: {len(device_activity)}")
                ]))
            
            # Update device filter options
            device_options = [{'label': 'All Devices', 'value': 'all'}] + [
                {'label': f"{device['ip']} ({device['vendor']})", 'value': device['ip']}
                for device in self.toolkit.devices
            ]
            
            return figure, log_entries, device_info, device_options

        self.toolkit.start_packet_capture()
        app.run_server(host='127.0.0.1', port=8050)

    def print_welcome_message(self):
        print("""
        Welcome to the User-Friendly Network Analysis Toolkit!
        
        This toolkit allows you to perform various network analysis tasks:
        
        1. Quick Network Scan: Discover devices on your network
        2. Network Monitoring: Analyze network traffic and detect anomalies
        3. Network Dashboard: Visualize network activity in real-time
        
        To get started, use one of the following commands:
        
        - For a quick network scan:
          python3 user_friendly_toolkit.py --scan
        
        - To monitor network activity for a specific duration:
          python3 user_friendly_toolkit.py --monitor --duration 300
        
        - To launch the network dashboard:
          python3 user_friendly_toolkit.py --dashboard
        
        - For more information and options:
          python3 user_friendly_toolkit.py --help

        Note: Some features may require administrator/root privileges to access network interfaces.
        
        Important: For geolocation features, you need to download the GeoLite2-City database.
        Visit https://dev.maxmind.com/geoip/geolite2-free-geolocation-data to download the database.
        Place the .mmdb file in the same directory as this script.

        Happy analyzing!
        """)

if __name__ == "__main__":
    toolkit = UserFriendlyNetworkToolkit()
    toolkit.print_welcome_message()
    toolkit.run()
