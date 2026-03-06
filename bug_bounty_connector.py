import requests
from abc import ABC, abstractmethod

# 抽象类定义连接器框架
class BugBountyPlatformConnector(ABC):
    @abstractmethod
    def fetch_bounties(self):
        pass
    
    @abstractmethod
    def report_vulnerability(self, vuln_details):
        pass

    @abstractmethod
    def get_vulnerability_details(self, vuln_id):
        pass

# HackerOne连接器
class HackerOneConnector(BugBountyPlatformConnector):
    def __init__(self, api_key, endpoint='https://api.hackerone.com'):  
        self.api_key = api_key
        self.endpoint = endpoint

    def fetch_bounties(self):
        response = requests.get(f'{self.endpoint}/bounties', headers={'Authorization': f'Bearer {self.api_key}'})
        return response.json()  

    def report_vulnerability(self, vuln_details):
        response = requests.post(f'{self.endpoint}/vulnerabilities', json=vuln_details, headers={'Authorization': f'Bearer {self.api_key}'})
        return response.json() 

    def get_vulnerability_details(self, vuln_id):
        response = requests.get(f'{self.endpoint}/vulnerabilities/{vuln_id}', headers={'Authorization': f'Bearer {self.api_key}'})
        return response.json()

# Bugcrowd连接器
class BugcrowdConnector(BugBountyPlatformConnector):
    def __init__(self, api_key, endpoint='https://api.bugcrowd.com'): 
        self.api_key = api_key
        self.endpoint = endpoint

    def fetch_bounties(self):
        response = requests.get(f'{self.endpoint}/bounties', headers={'Authorization': f'Bearer {self.api_key}'})
        return response.json()

    def report_vulnerability(self, vuln_details):
        response = requests.post(f'{self.endpoint}/vulnerabilities', json=vuln_details, headers={'Authorization': f'Bearer {self.api_key}'})
        return response.json()

    def get_vulnerability_details(self, vuln_id):
        response = requests.get(f'{self.endpoint}/vulnerabilities/{vuln_id}', headers={'Authorization': f'Bearer {self.api_key}'})
        return response.json()

# Immunefi连接器
class ImmunefiConnector(BugBountyPlatformConnector):
    def __init__(self, api_key, endpoint='https://api.immunefi.com'):  
        self.api_key = api_key
        self.endpoint = endpoint

    def fetch_bounties(self):
        response = requests.get(f'{self.endpoint}/bounties', headers={'Authorization': f'Bearer {self.api_key}'})
        return response.json()

    def report_vulnerability(self, vuln_details):
        response = requests.post(f'{self.endpoint}/vulnerabilities', json=vuln_details, headers={'Authorization': f'Bearer {self.api_key}'})
        return response.json()  

    def get_vulnerability_details(self, vuln_id):
        response = requests.get(f'{self.endpoint}/vulnerabilities/{vuln_id}', headers={'Authorization': f'Bearer {self.api_key}'})
        return response.json()