-- Mock stock data for development. Prices are approximate placeholders, not live quotes.

INSERT INTO stocks (symbol, name, sector, current_price, prev_close) VALUES
('RELIANCE', 'Reliance Industries', 'Energy',          2900.00, 2900.00),
('TCS',      'Tata Consultancy Services', 'IT',        3900.00, 3900.00),
('INFY',     'Infosys',               'IT',            1550.00, 1550.00),
('HDFCBANK', 'HDFC Bank',             'Banking',       1650.00, 1650.00),
('ICICIBANK','ICICI Bank',            'Banking',       1200.00, 1200.00),
('SBIN',     'State Bank of India',   'Banking',        800.00,  800.00),
('ITC',      'ITC Limited',           'FMCG',           450.00,  450.00),
('LT',       'Larsen & Toubro',       'Infrastructure',3600.00, 3600.00),
('BHARTIARTL','Bharti Airtel',        'Telecom',       1500.00, 1500.00),
('TATAMOTORS','Tata Motors',          'Automobile',     950.00,  950.00),
('WIPRO',    'Wipro',                 'IT',             480.00,  480.00),
('ASIANPAINT','Asian Paints',         'Consumer',      2900.00, 2900.00);

INSERT INTO price_history (stock_id, price)
SELECT id, current_price FROM stocks;
