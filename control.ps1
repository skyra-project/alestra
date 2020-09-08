Function Step-Main {
    Param (
        [string]$Command = "default"
    )

    Process {
        switch ( $Command ) {
            build { yarn clean && yarn build && docker build -t alestra:latest . }
            run { docker container run -it alestra:latest /bin/sh }
            remove { docker rmi -f alestra:latest }
            default { Write-Host "Unrecognized command, please try again" -ForegroundColor Red }
        }
    }
}

Step-Main @args