# User-Friendly Network Analysis Toolkit

This toolkit provides a set of tools for network analysis, including device discovery, traffic monitoring, and a real-time dashboard for visualizing network activity.

## Features

- Network scanning to discover devices on the local network
- Continuous network monitoring and packet analysis
- Real-time dashboard for visualizing network activity
- Device-specific filtering of network traffic
- Export of suspicious activity logs

## Requirements

- Python 3.7+
- Nmap
- GeoLite2-City database

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/jwebster2469/user-friendly-network-toolkit.git
   cd user-friendly-network-toolkit
   ```

2. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

3. Download the GeoLite2-City database from [MaxMind](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data) and place the `.mmdb` file in the same directory as the script.

## Usage

The toolkit provides several command-line options:

- Perform a network scan:
  ```
  python3 user_friendly_toolkit.py --scan
  ```

- Monitor network activity for a specific duration:
  ```
  python3 user_friendly_toolkit.py --monitor --duration 300
  ```

- Launch the network dashboard:
  ```
  python3 user_friendly_toolkit.py --dashboard
  ```

- View help and all available options:
  ```
  python3 user_friendly_toolkit.py --help
  ```

Note: Some features may require administrator/root privileges to access network interfaces.

## Dashboard

The dashboard provides a real-time view of network activity. To access it:

1. Run the dashboard command as shown above.
2. Open a web browser and navigate to `http://127.0.0.1:8050`.

The dashboard includes:
- A graph of network activity over time
- A log of recent network events
- Device-specific information and activity counts
- A dropdown to filter activity by specific devices

## Contributing

Contributions to improve the toolkit are welcome. Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is for educational and ethical use only. Always ensure you have permission to monitor and analyze networks you do not own or operate. The authors are not responsible for any misuse or damage caused by this tool.