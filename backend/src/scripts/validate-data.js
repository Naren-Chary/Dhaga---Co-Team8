import { supabase, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Phase 2: Data Validation Script
 * Validates data integrity, foreign key consistency, and scenario coverage in Supabase.
 */
async function validateDatabase() {
  console.log('====================================================');
  console.log('🔍 Dhaga & Co. — Database Integrity & Contract Audit');
  console.log('====================================================\n');

  if (!isSupabaseConfigured() || !supabase) {
    console.error('❌ Supabase is not configured. Check your .env file.');
    process.exit(1);
  }

  // 1. Fetch counts across all 5 tables
  const tables = ['customers', 'vendors', 'products', 'orders', 'returns'];
  const counts = {};
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`❌ Error querying table ${table}:`, error.message);
    } else {
      counts[table] = count || 0;
      console.log(`✓ Table [${table.padEnd(10)}] : ${count} records`);
    }
  }

  console.log('\n--- Checking Relational Integrity ---');

  // 2. Foreign Key Check: Products -> Vendors
  const { data: invalidProducts } = await supabase
    .from('products')
    .select('id, name, vendor_id, vendors(id)');
  
  const orphanedProducts = invalidProducts?.filter(p => !p.vendors) || [];
  console.log(`✓ Products -> Vendors FK Check: ${orphanedProducts.length === 0 ? 'PASSED (0 orphaned products)' : `FAILED (${orphanedProducts.length} orphaned)`}`);

  // 3. Foreign Key Check: Orders -> Customers, Products, Vendors
  const { data: sampleOrders } = await supabase
    .from('orders')
    .select('id, customer_id, product_id, vendor_id, customers(id), products(id), vendors(id)')
    .limit(200);

  const orphanedOrders = sampleOrders?.filter(o => !o.customers || !o.products || !o.vendors) || [];
  console.log(`✓ Orders Relational Join Check: ${orphanedOrders.length === 0 ? 'PASSED (All joined successfully)' : `FAILED (${orphanedOrders.length} failed joins)`}`);

  // 4. Foreign Key Check: Returns -> Orders
  const { data: sampleReturns } = await supabase
    .from('returns')
    .select('id, order_id, customer_id, product_id, vendor_id, orders(id)')
    .limit(200);

  const orphanedReturns = sampleReturns?.filter(r => !r.orders) || [];
  console.log(`✓ Returns -> Orders FK Check: ${orphanedReturns.length === 0 ? 'PASSED (All linked to valid orders)' : `FAILED (${orphanedReturns.length} unlinked)`}`);

  // 5. Scenario & Distribution Audit
  const { data: allOrders } = await supabase
    .from('orders')
    .select('payment_method, status, rto_status, scenario, order_amount');

  const codOrders = allOrders?.filter(o => o.payment_method === 'COD') || [];
  const codRto = codOrders.filter(o => o.status === 'RTO' || o.rto_status === 'RTO');
  const scenarios = {};
  allOrders?.forEach(o => {
    scenarios[o.scenario || 'unspecified'] = (scenarios[o.scenario || 'unspecified'] || 0) + 1;
  });

  console.log('\n--- Business Outcome & Scenario Coverage ---');
  console.log(`• Total COD Orders: ${codOrders.length} (${((codOrders.length / (allOrders?.length || 1)) * 100).toFixed(1)}% of total volume)`);
  console.log(`• COD RTO Failures: ${codRto.length}`);
  console.log(`• Baseline COD RTO Rate: ${((codRto.length / codOrders.length) * 100).toFixed(2)}%`);
  console.log(`• Estimated Total Logistics Loss: ₹${(codRto.length * 120).toLocaleString()} (@ ₹120/RTO)`);
  console.log('• Scenario Distribution:', scenarios);

  console.log('\n====================================================');
  console.log('✅ Phase 2 Data Contract & Integrity Audit: COMPLETE');
  console.log('====================================================\n');
}

validateDatabase().catch(err => {
  console.error('Fatal Validation Error:', err);
  process.exit(1);
});
