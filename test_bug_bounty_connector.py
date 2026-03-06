import unittest
from bug_bounty_connector import HackerOneConnector, BugcrowdConnector, ImmunefiConnector
from unittest.mock import patch

class TestBugBountyConnectors(unittest.TestCase):

    @patch('requests.get')
    def test_fetch_bounties_hackerone(self, mock_get):
        mock_get.return_value.json.return_value = [{'id': 1, 'name': 'Bug1'}, {'id': 2, 'name': 'Bug2'}]
        connector = HackerOneConnector(api_key='test-api-key')
        bounties = connector.fetch_bounties()
        self.assertEqual(len(bounties), 2)
        self.assertEqual(bounties[0]['name'], 'Bug1')

    @patch('requests.post')
    def test_report_vulnerability_bugcrowd(self, mock_post):
        mock_post.return_value.json.return_value = {'status': 'success'}
        connector = BugcrowdConnector(api_key='test-api-key')
        vuln_details = {'title': 'Test Vulnerability', 'description': 'Test Description'}
        response = connector.report_vulnerability(vuln_details)
        self.assertEqual(response['status'], 'success')

    @patch('requests.get')
    def test_get_vulnerability_details_immunefi(self, mock_get):
        mock_get.return_value.json.return_value = {'id': 1, 'title': 'Vuln1', 'description': 'Description'}
        connector = ImmunefiConnector(api_key='test-api-key')
        vuln_details = connector.get_vulnerability_details(1)
        self.assertEqual(vuln_details['title'], 'Vuln1')

if __name__ == '__main__':
    unittest.main()