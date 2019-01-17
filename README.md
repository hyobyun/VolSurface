# VolSurface
![An ugly volatility surface](/screenshot.png?raw=true "Screenshot of volatility surface")
I'm too poor to be able to afford Bloomberg Terminal, and I wanted a decent way to visualize implied volatility across different dates and strikes. This is a Volatility Surface Visualization you can run in a modern browser. You must input data from the CBOE quote export tools.

This is still a work in progress

## Install Instructions
`npm Install`

## Usage Instructions
To Get Data, goto <http://www.cboe.com/delayedquote/quote-table-download> and download a .dat file.
Click "Add File" and upload the file in the prompt.

## Upcoming:
- Axis labels
- Parameterization /Interpolation
- Surface 2D Slice Visualization

Currently the surfaces created are sort of ugly due to imperfect pricing data for illiquid contracts. Some sort of interpolation or parameterization is needed in order to produce nice looking plots.
