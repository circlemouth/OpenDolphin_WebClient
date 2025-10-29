package open.dolphin.mbean;

import java.io.*;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.text.DateFormat;
import java.util.Collection;
import java.util.Date;
import java.util.Properties;
import java.util.logging.Logger;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.enterprise.concurrent.ManagedThreadFactory;
import javax.inject.Inject;
import javax.jms.*;
import open.dolphin.infomodel.HealthInsuranceModel;
import open.dolphin.infomodel.PatientVisitModel;
import open.dolphin.session.PVTServiceBean;
import open.orca.rest.ORCAConnection;

/**
 *
 * @author Kazushi Minagawa. Digital Globe, Inc.
 * 
 * minagawa^ WildFly 8.2
 *   1) MBean 化廃止
 *   2) Server threadにManagedThreadFactoryを使用
 *   3) custom.properits の読み込みを ORCAConnection 一箇所
 */
@Singleton
@Startup
public class PvtService implements Runnable {
   
    private static final int EOT = 0x04;
    private static final int ACK = 0x06;
    private static final int NAK = 0x15;
    private static final String UTF8 = "UTF-8";
//minagawa^     
    @Resource(lookup="java:jboss/ee/concurrency/factory/default")
    private ManagedThreadFactory threadFactory;
//minagawa$    
    
    @Inject
    PVTServiceBean pvtServiceBean;
    
    private ServerSocket listenSocket;
    private String encoding = UTF8;
    private Thread serverThread;
    private String FACILITY_ID;
    private boolean DEBUG;
    
    @PostConstruct
    public void register() {
        
        DEBUG = Logger.getLogger("open.dolphin").getLevel().equals(java.util.logging.Level.FINE);
        
        try {
            startService();
            
        } catch (FileNotFoundException e) {
        } catch (Exception e) {
            warn(e.getMessage());
        }
    }

    public void startService() throws FileNotFoundException, Exception {
 
//minagawa^        
        Properties config = ORCAConnection.getInstance().getProperties();
//minagawa$
        
        FACILITY_ID = config.getProperty("dolphin.facilityId");
        
        // 受付受信を行うかどうかを判定する
        boolean useAsPVTServer;
        String test = config.getProperty("useAsPVTServer");
        if (test!=null) {
            useAsPVTServer = Boolean.parseBoolean(test);
        } else {
            useAsPVTServer = false;
        }
        
        if (!useAsPVTServer) {
            return;
        }
        
        // bindIP
        String bindIP = config.getProperty("pvt.listen.bindIP");
        
        // port番号
        int port = Integer.parseInt(config.getProperty("pvt.listen.port"));
        
        // encoding
        encoding = config.getProperty("pvt.listen.encoding");
        
        InetAddress addr = InetAddress.getByName(bindIP);
        InetSocketAddress socketAddress = new InetSocketAddress(addr, port);
        
        listenSocket = new ServerSocket();
        listenSocket.bind(socketAddress);
        log("PVT Server is binded " + socketAddress + " with encoding: " + encoding);
        
//minagawa^ Use ManagedThreadFactory
        serverThread = threadFactory.newThread(this);
//minagawa$        
        serverThread.start();
        log("server thread started"); 
    }

    @PreDestroy
    public void stopService() {
        log("PreDestroy did call");
        
        if (serverThread != null) {
            serverThread = null;
        }

        if (listenSocket != null) {
            try {
                listenSocket.close();
                listenSocket = null;
                log("PVT Server is closed");
            } catch (IOException e) {
                e.printStackTrace(System.err);
            }
        }
    }
    
    private void log(String msg) {
        Logger.getLogger("open.dolphin").info(msg);
    }
    
    private void warn(String msg) {
        Logger.getLogger("open.dolphin").warning(msg);
    }
    
    private void debug(String msg) {
        if (DEBUG) {
            Logger.getLogger("open.dolphin").fine(msg);
        }
    }
    
    @Override
    public void run() {

        Thread thisThread = Thread.currentThread();

        while (thisThread==serverThread) {
            try {
                Socket clientSocket = listenSocket.accept();
                PvtService.Connection con = new PvtService.Connection(clientSocket);
                Thread t = new Thread(con);
                t.setPriority(Thread.NORM_PRIORITY);
                t.start();
            } catch (IOException e) {
                if (thisThread!=serverThread) {
                } else {
                    e.printStackTrace(System.err);
                }
            }
        }
    }
  
    protected final class Connection implements Runnable {

        private Socket client;

        public Connection(Socket clientSocket) {
            this.client = clientSocket;
        }
        
        private void printInfo() {
            String addr = this.client.getInetAddress().getHostAddress();
            String time = DateFormat.getDateTimeInstance().format(new Date());
            StringBuilder sb = new StringBuilder();
            sb.append("connected from ").append(addr).append(" at ").append(time);
            log(sb.toString());
        }

        @Override
        public void run() {

            BufferedInputStream reader;
            BufferedOutputStream writer = null;
            javax.jms.Connection conn = null;
            
            try {
                printInfo();
                
                reader = new BufferedInputStream(new DataInputStream(this.client.getInputStream()));
                writer = new BufferedOutputStream(new DataOutputStream(this.client.getOutputStream()));
                
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                BufferedOutputStream buf = new BufferedOutputStream(bo);
                String recieved;

                byte[] buffer = new byte[16384];
                int readLen;

                while (true) {

                    readLen = reader.read(buffer);

                    if (readLen == -1) {
                        debug("EOF");
                        break;
                    }

                    if (buffer[readLen-1] == EOT) {
                        buf.write(buffer, 0, readLen-1);
                        buf.flush();
                        recieved = bo.toString(encoding);
                        int len = recieved.length();
                        bo.close();
                        buf.close();
                        
                        //---------------------------------------------
                        StringBuilder sb = new StringBuilder();
                        sb.append("length of claim instance = ");
                        sb.append(len);
                        sb.append(" bytes");
                        log(sb.toString());
                        debug(recieved);
                        
//                        //---------------------------------------------
//                        // send queue
//                        //---------------------------------------------
//                        conn = connectionFactory.createConnection();
//                        Session session = conn.createSession(false, QueueSession.AUTO_ACKNOWLEDGE);
//                        ObjectMessage msg = session.createObjectMessage(recieved);
//                        MessageProducer producer = session.createProducer(queue);
//                        producer.send(msg);
                        
                        log(recieved);
                        int result = parseAndSend(recieved);
                        
                        // Reply ACK
                        writeRetCode(writer, ACK);

                    } else {
                        buf.write(buffer, 0, readLen);
                    }
                }

                reader.close();
                writer.close();
                client.close();
                client = null;
                
            } catch (Exception e) {
                writeRetCode(writer, NAK);
                e.printStackTrace(System.err);
                warn(e.getMessage());
                
            } finally {
                if(conn != null) {
                    try {
                        conn.close();
                    } catch (JMSException e) {
                        e.printStackTrace(System.err);
                        warn(e.getMessage());
                    }
                }
                if (client != null) {
                    try {
                        client.close();
                        client = null;
                    } catch (IOException e2) {
                        e2.printStackTrace(System.err);
                        warn(e2.getMessage());
                    }
                }
            }
        }
        
        private void writeRetCode(BufferedOutputStream writer, int retCode) {
            if (writer!=null) {
                try {
                    writer.write(retCode);
                    writer.flush();
                    log("return code = " + retCode);
                } catch (Exception e) {
                    e.printStackTrace(System.err);
                    warn(e.getMessage());
                }
            }
        }
        
        private int parseAndSend(String pvtXml) throws Exception {
        
            // Parse
            BufferedReader r = new BufferedReader(new StringReader(pvtXml));
            PVTBuilder builder = new PVTBuilder();
            builder.parse(r);
            PatientVisitModel model = builder.getProduct();
            
//s.oh^ 2014/03/13 ORCA患者登録対応
            if(model == null) {
                return -1;
            }
//s.oh$

            // 関係構築
            model.setFacilityId(FACILITY_ID);
            model.getPatientModel().setFacilityId(FACILITY_ID);

            Collection<HealthInsuranceModel> c = model.getPatientModel().getHealthInsurances();
            if (c!= null && c.size() > 0) {
                for (HealthInsuranceModel hm : c) {
                    hm.setPatient(model.getPatientModel());
                }
            }

            int result = pvtServiceBean.addPvt(model);
            
            return result;
        }
    }
}
