function createSemiCircleChart(ctx, initialValue) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Usage', 'Remaining'],
            datasets: [{
                data: [initialValue, 100 - initialValue],
                backgroundColor: ['#3498db', '#e0e0e0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutoutPercentage: 80,  // Adjust the cutout percentage to create the semicircle effect
            rotation: -90, // Start the chart from the top
            circumference: 180, // Limit to a semicircle
            plugins: {
                datalabels: {
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 16
                    },
                    formatter: (value, ctx) => {
                        const dataset = ctx.chart.data.datasets[0];
                        const sum = dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / sum) * 100).toFixed(1) + '%';
                        return percentage;
                    }
                }
            }
        }
    });
}

function updateChart(chart, value) {
    chart.data.datasets[0].data = [value, 100 - value];
    chart.update();
}

function fetchSystemHealth() {
    fetch('http://127.0.0.1:5000/predict')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.json();
        })
        .then(data => {
            const systemHealth = data.system_health || 'unknown';
            const cpuUsage = data.cpu_usage_percent || 0;
            const diskUsageC = data['disk_usage_C:'] || 0;
            const diskUsageD = data['disk_usage_D:'] || 0;
            const diskUsageE = data['disk_usage_E:'] || 0;
            const ramUsage = data.ram_usage_percent || 0;

            // Update status
            const statusElement = document.getElementById('status');
            if (systemHealth === 'good') {
                statusElement.textContent = 'System Health: Good';
                statusElement.className = 'status good';
            } else if (systemHealth === 'bad') {
                statusElement.textContent = 'System Health: Bad';
                statusElement.className = 'status bad';
            } else {
                statusElement.textContent = 'System Health: Unknown';
                statusElement.className = 'status';
            }

            // Update charts
            updateChart(cpuChart, cpuUsage);
            updateChart(ramChart, ramUsage);
            updateChart(diskCChart, diskUsageC);
            updateChart(diskDChart, diskUsageD);
            updateChart(diskEChart, diskUsageE);
        })
        .catch(error => {
            console.error('Error fetching system health:', error);
            const statusElement = document.getElementById('status');
            statusElement.textContent = 'Error fetching system health';
            statusElement.className = 'status';
        });
}

// Create charts
const ctxCPU = document.getElementById('cpuChart').getContext('2d');
const cpuChart = createSemiCircleChart(ctxCPU, 0);

const ctxRAM = document.getElementById('ramChart').getContext('2d');
const ramChart = createSemiCircleChart(ctxRAM, 0);

const ctxDiskC = document.getElementById('diskCChart').getContext('2d');
const diskCChart = createSemiCircleChart(ctxDiskC, 0);

const ctxDiskD = document.getElementById('diskDChart').getContext('2d');
const diskDChart = createSemiCircleChart(ctxDiskD, 0);

const ctxDiskE = document.getElementById('diskEChart').getContext('2d');
const diskEChart = createSemiCircleChart(ctxDiskE, 0);

// Fetch system health every 2 seconds
setInterval(fetchSystemHealth, 2000);

// Fetch system health immediately on load
fetchSystemHealth();