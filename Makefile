
run:
	docker run -d --rm -p 3000:3000 --name theia-binalyzer theia-binalyzer:latest

fetch-glsp:
	cp ../binalyzer-glsp/examples/org.eclipse.glsp.example.workflow/target/org.eclipse.glsp.example.workflow-0.8.0-SNAPSHOT-glsp.jar theia-binalyzer-glsp.jar

run-glsp:
	java -jar theia-binalyzer-glsp.jar

build:
	docker build -t theia-binalyzer:latest .

clean:
	docker rm theia-binalyzer -f |:
	docker image rm theia-binalyzer -f |:
