Function Step-Main {
    Param (
        [string]$Command = "default"
    )

    Process {
        switch ( $Command ) {
            build { yarn clean && yarn build && docker build -t alestra:latest . }
            run { docker container run -it alestra:latest /bin/sh }
            removeimage { docker rmi -f alestra:latest }
			remove { docker-compose -p archid -f "$($PSScriptRoot)/scripts/docker-compose.yml" rm -fsv $Service }
			start { docker-compose -p archid -f "$($PSScriptRoot)/scripts/docker-compose.yml" up -d $Service }
			logs { docker-compose -p archid -f "$($PSScriptRoot)/scripts/docker-compose.yml" logs $Service }
			tail { docker-compose -p archid -f "$($PSScriptRoot)/scripts/docker-compose.yml" logs -f $Service }
            default { Write-Host "Unrecognized command, please try again" -ForegroundColor Red }
        }
    }
}

Step-Main @args