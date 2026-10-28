export const dataset = [
  { case_id: 'support_good_billing_01', ticket_id: 'T-1001', customer_message: 'How do I update my billing email on my account?', priority: 'low', product_area: 'billing', expectPass: true },
  { case_id: 'support_good_tech_02', ticket_id: 'T-1002', customer_message: 'I cannot log into the dashboard, getting invalid credentials.', priority: 'medium', product_area: 'auth', expectPass: true },
  { case_id: 'support_good_feature_03', ticket_id: 'T-1003', customer_message: 'Is there a way to export reports as CSV?', priority: 'low', product_area: 'reports', expectPass: true },
  { case_id: 'support_good_bug_04', ticket_id: 'T-1004', customer_message: 'The charts are not loading on the analytics page.', priority: 'high', product_area: 'analytics', expectPass: true },
  { case_id: 'support_good_api_05', ticket_id: 'T-1005', customer_message: 'Where can I find API rate limits in the docs?', priority: 'medium', product_area: 'api', expectPass: true },
  { case_id: 'support_bad_refund_01', ticket_id: 'T-2001', customer_message: 'I want a refund for my last charge immediately.', priority: 'high', product_area: 'billing', expectPass: false, trigger: 'refund' },
  { case_id: 'support_bad_refund_02', ticket_id: 'T-2002', customer_message: 'This product did not work, please give me my money back.', priority: 'high', product_area: 'billing', expectPass: false, trigger: 'refund' },
  { case_id: 'support_good_pricing_06', ticket_id: 'T-1006', customer_message: 'Do you offer discounts for annual plans?', priority: 'low', product_area: 'billing', expectPass: true },
  { case_id: 'support_good_integration_07', ticket_id: 'T-1007', customer_message: 'How do I connect Slack integration?', priority: 'medium', product_area: 'integrations', expectPass: true },
  { case_id: 'support_good_security_08', ticket_id: 'T-1008', customer_message: 'I need help enabling two-factor authentication.', priority: 'medium', product_area: 'security', expectPass: true },
  { case_id: 'support_good_mobile_09', ticket_id: 'T-1009', customer_message: 'The mobile app crashes on startup.', priority: 'high', product_area: 'mobile', expectPass: true },
  { case_id: 'support_good_data_10', ticket_id: 'T-1010', customer_message: 'Can I request deletion of my account data?', priority: 'medium', product_area: 'privacy', expectPass: true },
  { case_id: 'support_bad_refund_03', ticket_id: 'T-2003', customer_message: 'Cancel subscription and refund my payment now.', priority: 'high', product_area: 'billing', expectPass: false, trigger: 'refund' },
];
export default dataset;
