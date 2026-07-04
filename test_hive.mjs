const response = await fetch("https://api.hive.blog", {
  method: "POST",
  body: JSON.stringify({
    jsonrpc: "2.0",
    method: "condenser_api.get_account_history",
    params: ["faireye", -1, 1000, 2], // 2 = custom_json_operation? No, op_type filter was removed or changed. Let's just fetch all and filter.
    id: 1
  })
});
const data = await response.json();
const ops = data.result.filter(tx => tx[1].op[0] === 'custom_json' && tx[1].op[1].id.startsWith('news_'));
console.log(ops.length);
