document.addEventListener("DOMContentLoaded", () => {
    console.log("NTS Scraper App Loaded");

    const scanButton = document.getElementById("scan-button");
    if (scanButton) {
        scanButton.addEventListener("click", () => {
            const urlInput = document.getElementById("url-input").value;
            if (urlInput) {
                alert(`Scanning ${urlInput}...`);
                // Add scraping logic here
            } else {
                alert("Please enter a URL to scan.");
            }
        });
    }
});