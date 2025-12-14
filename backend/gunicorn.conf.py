import multiprocessing

bind = "0.0.0.0:5000"

workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
threads = 2
timeout = 120

loglevel = "info"
accesslog = "-"
errorlog = "-"

proc_name = "sportsplatform_backend"

daemon = False
