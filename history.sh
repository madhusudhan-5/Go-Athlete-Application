root@srv503048:~# history 
    1  ls -ltr
    2  cd
    3  ls -ltr
    4  cd /opt/
    5  ls
    6  mkdir goathleteBackend
    7  ls
    8  cd goathleteBackend/
    9  cd /opt/goathleteBackend/
   10  ls
   11  cd backend/
   12  ls
   13  sudo ./deploy/deploy.sh
   14  cd deploy/
   15  ls
   16  touch fix-ubuntu-repos.sh
   17  vi fix-ubuntu-repos.sh 
   18  cd ../
   19  chmod +x deploy/fix-ubuntu-repos.sh
   20  sudo ./deploy/fix-ubuntu-repos.sh
   21  sudo ./deploy/deploy.sh
   22  sudo bash -c 'cat > /etc/apt/sources.list << EOF
   23  deb http://old-releases.ubuntu.com/ubuntu/ lunar main restricted universe multiverse
   24  deb http://old-releases.ubuntu.com/ubuntu/ lunar-updates main restricted universe multiverse
   25  deb http://old-releases.ubuntu.com/ubuntu/ lunar-security main restricted universe multiverse
   26  deb http://old-releases.ubuntu.com/ubuntu/ lunar-backports main restricted universe multiverse
   27  EOF'
   28  sudo apt update
   29  sudo ./deploy/deploy.sh
   30  ipconfig
   31  ifconfig
   32  sudo ./deploy/setup-domain.sh
   33  cd deploy/
   34  ls
   35  vi setup-domain.sh 
   36  sudo mkdir -p /var/www/letsencrypt/.well-known/acme-challenge
   37  sudo chmod -R 755 /var/www/letsencrypt
   38  sudo chown -R www-data:www-data /var/www/letsencrypt
   39  sudo nano /etc/nginx/sites-available/goathlete.in
   40  sudo nginx -t
   41  sudo systemctl reload nginx
   42  sudo certbot --nginx -d goathlete.in --email YOUR_EMAIL --agree-tos
   43  cat /etc/nginx/sites-available/goathlete.in
   44  ls -la /etc/nginx/sites-enabled/
   45  sudo rm -f /etc/nginx/sites-enabled/default
   46  sudo systemctl reload nginx
   47  echo "test123" > /var/www/letsencrypt/.well-known/acme-challenge/test.txt
   48  curl http://goathlete.in/.well-known/acme-challenge/test.txt
   49  sudo certbot certonly --webroot -w /var/www/letsencrypt -d goathlete.in --email YOUR_EMAIL --agree-tos
   50  sudo certbot certonly --webroot -w /var/www/letsencrypt -d goathlete.in --email contact@goathlete.in --agree-tos
   51  sudo certbot certonly --webroot -w /var/www/letsencrypt -d goathlete.in --email cupport@goathlete.in --agree-tos
   52  sudo nano /etc/nginx/sites-available/goathlete.in
   53  sudo nginx -t
   54  sudo systemctl reload nginx
   55  echo "test123" > /var/www/letsencrypt/.well-known/acme-challenge/test.txt
   56  curl http://127.0.0.1/.well-known/acme-challenge/test.txt
   57  sudo certbot --nginx -d goathlete.in --email contact@goathlete.in --agree-tos
   58  certbot --nginx -d goathlete.in --email contact@goathlete.in --agree-tos
   59  cd ../
   60  cd /opt/goathleteBackend/backend
   61  source ../venv/bin/activate
   62  python manage.py collectstatic --noinput
   63  python3 manage.py collectstatic --noinput
   64  ls
   65  ls -lart
   66  source ../venv/bin/activate
   67  source ./venv/bin/activate
   68  cd ../
   69  ls
   70  ls -lart
   71  $VENV_DIR
   72  source $VENV_DIR/bin/activate
   73  cd backend/
   74  source $VENV_DIR/bin/activate
   75  ls
   76  cd backend/
   77  ls
   78  cd ../
   79  ls
   80  source $VENV_DIR/bin/activate
   81  source venv/bin/activate
   82  source .venv/bin/activate
   83  cd ../
   84  ls
   85  ls lktr
   86  ls ltr
   87  ls -ltr
   88  ls -lart
   89  cd ../
   90  ls
   91  cd sportsplatform/
   92  ls
   93  cd backend/
   94  ls
   95  source venv/bin/activate
   96  cd ../
   97  source venv/bin/activate
   98  cd backend/
   99  python manage.py collectstatic --noinput
  100  sudo chown -R www-data:www-data /opt/goathleteBackend/backend/staticfiles
  101  sudo chmod -R 755 /opt/goathleteBackend/backend/staticfiles
  102  sudo chmod -R 755 /opt/sports/backend/staticfiles
  103  sudo chmod -R 755 /opt/sportsplatform/backend/staticfiles
  104  sudo chown -R www-data:www-data /opt/sportsplatform/backend/staticfiles
  105  ls -la /opt/sportsplatform/backend/staticfiles/
  106  sudo systemctl reload nginx
  107  ls
  108  sudo systemctl reload nginx
  109  sudo nano /etc/nginx/sites-available/goathlete.in
  110  sudo nano /etc/nginx/sites-available/goathlete.in
  111  sudo nano /etc/nginx/sites-available/default
  112  sudo systemctl reload nginx
  113  sudo nano /etc/nginx/sites-available/default
  114  sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
  115  sudo nginx -t
  116  sudo systemctl reload nginx
  117  certbot --nginx -d goathlete.in --email contact@goathlete.in --agree-tos
  118  sudo systemctl status sportsplatform
  119  ls
  120  cd static
  121  ls
  122  cd ../
  123  cd staticfiles/
  124  ls
  125  sudo systemctl status nginx
  126  ss -tlnp | grep :80
  127  sudo ufw status
  128  sudo ufw allow 80
  129  sudo ufw allow 443
  130  ls -la /etc/nginx/sites-enabled/
  131  cat /etc/nginx/sites-available/default
  132  sudo systemctl reload nginx
  133  sudo systemctl status nginx
  134  certbot --nginx -d goathlete.in --email contact@goathlete.in --agree-tos
  135  cat /var/log/letsencrypt/letsencrypt.log
  136  sudo ufw allow http
  137  sudo nano /etc/nginx/sites-available/goathlete.in
  138  sudo systemctl reload nginx
  139  curl -X POST http://127.0.0.1:5000/api/auth/login/ -H "Content-Type: application/json" -d '{"email":"vendor@sportsarena.com", "password":"Vendor@123"}'
  140  ls
  141  cd /opt/
  142  ls
  143  cd sportsplatform/
  144  ls
  145  cd backend/
  146  ls
  147  cat gunicorn.conf.py 
  148  cd deploy/
  149  ls
  150  cd README.md
  151  cat README.md
  152  lsof -i:5000
  153  cd /var/
  154  ls
  155  cd log
  156  ls
  157  sudo nano /etc/systemd/system/gunicorn.service
  158  cd ../../
  159  cd /etc/systemd/system/
  160  ls
  161  ls -ltr
  162  cat sportsplatform.service
  163  sudo journalctl -u sportsplatform.service -f
  164  sudo chown www-data:www-data /opt/sportsplatform/backend/db.sqlite3
  165  sudo chmod 664 /opt/sportsplatform/backend/db.sqlite3
  166  sudo chown www-data:www-data /opt/sportsplatform/backend
  167  sudo chmod 775 /opt/sportsplatform/backend
  168  sudo journalctl -u sportsplatform.service -f
  169  sqlite3 db.sqlite3
  170  cd ../
  171  cd
  172  cd /opt/sportsplatform/backend/
  173  ls
  174  sqlite3 db.sqlite3
  175  apt install sqlite3
  176  sqlite3 db.sqlite3
  177  cd ../
  178  cd goathleteBackend/
  179  cd backend/
  180  sqlite3 db.sqlite3
  181  cd ../../sportsplatform/
  182  cd backend/
  183  sqlite3 db.sqlite3
  184  cd superadmin/
  185  ls
  186  nano models.py 
  187  cd ../
  188  ls
  189  python3 manage.py makemigrations
  190  cd ../
  191  ls
  192  source venv/bin/activate
  193  cd backend/
  194  python3 manage.py makemigrations
  195  python3 manage.py migrate
  196  sqlite3 db.sqlite3
  197  python3 manage.py migrate
  198  sudo systemctl reload nginx
  199  ls
  200  cd /opt/
  201  ls
  202  rmdir goathleteBackend/
  203  rmdir goathleteBackend
  204  rm -rf goathleteBackend
  205  ls
  206  cd sportsplatform/
  207  ls -lart
  208  cd ../
  209  ls -lart
  210  rm -rf sportsplatform/
  211  ls
  212  sudo systemctl status nginx
  213  sudo systemctl stop nginx
  214  sudo journalctl -u sportsplatform.service -f
  215  ls
  216  sudo systemctl stop nginx
  217  sudo systemctl stop sportsplatform.service
  218  sudo systemctl disable nginx
  219  sudo systemctl disable sportsplatform.service
  220  sudo rm /etc/systemd/system/sportsplatform.service
  221  sudo systemctl daemon-reload
  222  ps aux | grep gunicorn
  223  sudo kill -9 1771148
  224  ps aux | grep gunicorn
  225  sudo rm /etc/nginx/sites-enabled/sportsplatform
  226  sudo rm /etc/nginx/sites-available/sportsplatform
  227  sudo rm /etc/nginx/conf.d/sportsplatform.conf
  228  sudo rm -rf /var/www/sportsplatform
  229  sudo rm -rf /var/log/sportsplatform
  230  sudo rm /etc/nginx/sites-enabled/default
  231  sudo rm /etc/nginx/sites-available/default
  232  ls
  233  mkdir sportsplatform
  234  ls
  235  cd /opt/
  236  cd b
  237  cd bac
  238  ls
  239  cd sportsplatform/
  240  ls
  241  cd backend/
  242  sudo ./deploy/deploy.sh
  243  cd deploy/
  244  ls
  245  nano deploy.sh 
  246  cd ../deploy.sh 
  247  cd ../
  248  sudo ./deploy/deploy.sh
  249  sudo ./deploy/setup-domain.sh
  250  ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
  251  rm -f /etc/nginx/sites-enabled/default
  252  nginx -t
  253  systemctl reload nginx
  254  nginx -t
  255  sudo rm -rf /etc/nginx/sites-enabled/sites-available
  256  sudo nginx -t
  257  echo "[5/6] Testing ACME challenge access..."
  258  echo "test" > /var/www/letsencrypt/.well-known/acme-challenge/test.txt
  259  sleep 2
  260  TEST_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/.well-known/acme-challenge/test.txt)
  261  rm -f /var/www/letsencrypt/.well-known/acme-challenge/test.txt
  262  if [ "$TEST_RESULT" != "200" ]; then     echo "";     echo "WARNING: ACME challenge test returned HTTP $TEST_RESULT (expected 200)";     echo "Possible issues:";     echo "  - Firewall blocking port 80";     echo "  - DNS not pointing to this server";     echo "";     read -p "Continue anyway? (y/n): " CONTINUE;     if [ "$CONTINUE" != "y" ]; then         exit 1;     fi; fi
  263  certbot --nginx -d goathlete.in --email contact@goathlete.in --agree-tos --non-interactive --redirect
  264  cat /var/log/letsencrypt/letsencrypt.log
  265  sudo systemctl enable nginx
  266  sudo systemctl start nginx
  267  sudo nginx -t
  268  sudo systemctl restart nginx
  269  journalctl -xeu nginx.service --no-pager
  270  sudo lsof -i :80
  271  sudo systemctl stop apache2
  272  sudo systemctl stop nginx
  273  sudo kill -9 1772559
  274  sudo kill -9 1772562
  275  sudo nginx -t
  276  sudo systemctl start nginx
  277  sudo pkill -f certbot
  278  certbot --nginx -d goathlete.in --email contact@goathlete.in --agree-tos --non-interactive --redirect
  279  truncate -f /var/log/letsencrypt/letsencrypt.log
  280  sudo truncate -F /var/log/letsencrypt/letsencrypt.log
  281  sudo truncate -s 0F /var/log/letsencrypt/letsencrypt.log
  282  sudo truncate -s 0 /var/log/letsencrypt/letsencrypt.log
  283  certbot --nginx -d goathlete.in --email contact@goathlete.in --agree-tos --non-interactive --redirect
  284  cat /var/log/letsencrypt/letsencrypt.log
  285  sudo certbot --nginx -d api.goathlete.in --agree-tos --email contact@goathlete.in
  286  sudo nano /etc/nginx/sites-available/api.goathlete.in
  287  sudo ln -s /etc/nginx/sites-available/api.goathlete.in /etc/nginx/sites-enabled/
  288  sudo nginx -t
  289  sudo systemctl restart nginx
  290  source ../venv/bin/activate
  291  python manage.py collectstatic --noinput
  292  sudo chown -R www-data:www-data /opt/goathleteBackend/backend/staticfiles
  293  sudo chown -R www-data:www-data /opt/sportsplatform/backend/staticfiles
  294  sudo chmod -R 755 /opt/sportsplatform/backend/staticfiles
  295  ls -la /opt/sportsplatform/backend/staticfiles/
  296  sudo systemctl reload nginx
  297  sudo systemctl status nginx
  298  ss -tlnp | grep :80
  299  sudo ln -s /etc/nginx/sites-available/api.goathlete.in /etc/nginx/sites-enabled/
  300  sudo nano /etc/nginx/sites-available/api.goathlete.in
  301  sudo chown -R www-data:www-data /opt/sportsplatform/backend/staticfiles
  302  sudo chmod -R 755 /opt/sportsplatform/backend/staticfiles
  303  sudo nginx -t
  304  sudo systemctl restart nginx
  305  https://api.goathlete.in/static/admin/css/base.css
  306  ls
  307  cat .env
  308  ls -lart
  309  sudo chown -R www-data:www-data /opt/sportsplatform/backend
  310  sudo chmod -R 775 /opt/sportsplatform/backend
  311  ls -l /opt/sportsplatform/backend/db.sqlite3
  312  sudo systemctl restart sportsplatform
  313  sudo systemctl restart nginx
  314  cd superadmin/
  315  nano models.py 
  316  cd ../
  317  python manage.py makemigrations
  318  python manage.py migrate
  319  sqlite3 db.sqlite3
  320  python manage.py migrate
  321  sqlite3 db.sqlite3
  322  python manage.py migrate
  323  sqlite3 db.sqlite3
  324  python manage.py migrate
  325  cd ../
  326  ls
  327  source venv/bin/deactivate
  328  source .venv/bin/deactivate
  329  venv/bin/deactivate
  330  cd venv/
  331  ls
  332  cd bin/
  333  ls
  334  deactivate
  335  ls
  336  cd ../
  337  sudo mkdir -p /var/www/vendor
  338  sudo nano /etc/nginx/sites-available/api.goathlete.in
  339  sudo nginx -t
  340  sudo systemctl restart nginx
  341  sudo nginx -t
  342  sudo systemctl restart nginx
  343  sudo nginx -t
  344  sudo certbot --nginx -d vendor.goathlete.in
  345  ping vendor.goathlete.in
  346  ls
  347  ping vendor.goathlete.in
  348  certbot --nginx -d vendor.goathlete.in --email contact@goathlete.in --agree-tos --non-interactive --redirect
  349  ping vendor.goathlete.in
  350  certbot --nginx -d vendor.goathlete.in --email contact@goathlete.in --agree-tos --non-interactive --redirect
  351  sudo nano /etc/nginx/sites-available/api.goathlete.in
  352  sudo nginx -t
  353  sudo systemctl restart nginx
  354  sudo nano /etc/nginx/sites-available/api.goathlete.in
  355  sudo nginx -t
  356  sudo systemctl restart nginx
  357  ping vendor.goathlete.in
  358  certbot --nginx -d vendor.goathlete.in --email contact@goathlete.in --agree-tos --non-interactive --redirect
  359  /etc/letsencrypt/live/vendor.goathlete.in/
  360  /etc/letsencrypt/live/vendor.goathlete.in
  361  sudo ls -l /etc/letsencrypt/live/vendor.goathlete.in/
  362  sudo nano /etc/nginx/sites-available/api.goathlete.in
  363  sudo nginx -t
  364  sudo systemctl restart nginx
  365  sudo journalctl -u sportsplatform -f
  366  cd /opt/sportsplatform/backend/superadmin/
  367  nano views.py 
  368  vi views.py 
  369  cd ../../
  370  sudo systemctl restart sportsplatform
  371  sudo journalctl -u sportsplatform -f
  372  cd /opt/sportsplatform/backend/superadmin/
  373  vi views.py 
  374  cd ../
  375  sudo systemctl restart sportsplatform
  376  sudo journalctl -u sportsplatform -f
  377  cd /opt/sportsplatform/backend/superadmin/
  378  vi views.py 
  379  sudo systemctl restart sportsplatform
  380  sudo journalctl -u sportsplatform -f
  381  truncate -s 0 views.py 
  382  vi views.py 
  383  ls
  384  sudo systemctl restart sportsplatform
  385  sudo journalctl -u sportsplatform -f
  386  vi views.py 
  387  sudo systemctl restart sportsplatform
  388  sudo journalctl -u sportsplatform -f
  389  truncate -s 0 views.py 
  390  vi views.py 
  391  ls
  392  cd /opt/sportsplatform/backend/
  393  ls
  394  cd superadmin/
  395  truncate -s 0 views.py 
  396  vi views.py 
  397  cat views.py 
  398  sudo systemctl restart sportsplatform
  399  sudo journalctl -u sportsplatform -f
  400  vi serializers.py 
  401  sudo systemctl restart sportsplatform
  402  sudo journalctl -u sportsplatform -f
  403  vi models.py 
  404  cd../
  405  cd ../
  406  source ../venv/bin/activate
  407  python manage.py makemigrations
  408  python manage.py migrate
  409  sudo journalctl -u sportsplatform -f
  410  cd se
  411  cd superadmin/
  412  vi serializers.py 
  413  sudo systemctl restart sportsplatform
  414  sudo journalctl -u sportsplatform -f
  415  vi serializers.py 
  416  cd ../
  417  python manage.py shell
  418  cd superadmin/
  419  vi serializers.py 
  420  ls
  421  sudo systemctl restart sportsplatform
  422  sudo journalctl -u sportsplatform -f
  423  vi serializers.py 
  424  sudo journalctl -u sportsplatform -f
  425  vi serializers.py 
  426  sudo systemctl restart sportsplatform
  427  sudo journalctl -u sportsplatform -f
  428  history 
root@srv503048:~# 
