//https://www.gw2bltc.com/api/tp/chart/{id}
//response:
	//recordId, Date.now()/1000, sell$, buy$, sellQty, buyQty, [bought/sold numbers]
	//every 3 minutes
	
            // var d = f[0] * 1e3;
            // if (!e) {
                // itemData.first_time = d
            // }
            // f[1] = f[1] != 0 ? f[1] : null;
            // f[2] = f[2] != 0 ? f[2] : null;
            // itemData.chart.sell[e] = [d, f[1]];
            // itemData.chart.buy[e] = [d, f[2]];
            // itemData.chart.supply[e] = [d, f[3]];
            // itemData.chart.demand[e] = [d, f[4]];
            // itemData.chart.sold[e] = [d, f[5]];
            // itemData.chart.offers[e] = [d, f[6]];
            // itemData.chart.bought[e] = [d, f[7]];
            // itemData.chart.bids[e] = [d, f[8]];
            // if (analytics || rankX) {
                // f[9] = f[9] != 0 ? f[9] : null;
                // f[10] = f[10] != 0 ? f[10] : null;
                // itemData.chart.sell_true[e] = [d, f[9]];
                // itemData.chart.buy_true[e] = [d, f[10]];
                // itemData.chart.supply_true[e] = [d, f[11]];
                // itemData.chart.demand_true[e] = [d, f[12]]
            // }	

//VPT=Previous VPT+(Percentage Price Change×Volume)

//on click id
//https://www.gw2bltc.com/api/tp/chart/{id}


//all time avg,min,max,std
//year avg,min,max,std
//month avg,min,max,std
//week avg,min,max,std
//trend: month,week,day
	//group sales by day/hour/??
	//calculate grouped vpt for sell && buy
		//vpt = prev vpt + (sales * % price change)
		//initial vpt = 0
//display in popup/modal or new page?
	
const id = new URL(document.location).searchParams.get('id');

async function getDataBLTC(){
	
	const get = `https://www.gw2bltc.com/api/tp/chart/${id}`;
	console.log(get);
	const data = await (await fetch(get)).json() || [];
	console.log(data);
}

async function getDataTP(){
	
	const get = `https://www.gw2tp.com/api/trends?id=${id}`;
	console.log(get);
	const data = await (await fetch(get)).json() || [];
	console.log(data);
}

getDataTP();
getDataBLTC();