var fs = require('fs'),
	path = require('path'),
	http = require('http');

var MINE = {
	".css": "text/css",
	".js": "application/javascript"
};

function parseURL(root, url) {
	var base, pathnames, parts;

	if (url.indexOf("??") === -1) {
		url = url.replace("/", "/??");
	}

	parts = url.split("??");
	base = parts[0];
	pathnames = parts[1].split(",").map(function(value) {
		return path.join(root, base, value);
	});

	return {
		mine: MINE[path.extname(pathnames[0])] || "text/plain",
		pathnames: pathnames
	};
}

function combine(pathnames, callback) {
	var output = [];

	(function next(i, length) {
		if (i < length) {
			fs.readFile(pathnames[i], function(err, data) {
				if (err) {
					callback(err);
				} else {
					output.push(data);
					console.log(data);
					next(i + 1, length);
				}
			});
		} else {
			callback(null, Buffer.concat(output));
		}
	}(0, pathnames.length))
}

function main(argv) {
	var root = ".";
	var port = 80;

	http.createServer(function(request, response) {
		var urlInfo = parseURL(root, request.url);

		combine(urlInfo.pathnames, function(err, data) {
			if (err) {
				response.writeHead(404);
				response.end(err.message);
			} else {
				response.writeHead(200, {
					"Content-Type": urlInfo.mine
				});
				response.end(data);
			}
		});
	}).listen(port);
}

main(process.argv.slice(2));

console.log(parseURL(".", "http://www.example.com/assets/??bar.js,baz.js"));