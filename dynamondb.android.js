
var DynamonDB = (function(){

    function DynamonDB(params){
    	this.db = new com.amazonaws.mobile.ns.db.NSDynamoDB()
    }

    DynamonDB.prototype.save = function(data){
    	this.execute(data, 'create')
    }

		DynamonDB.prototype.update = function(data){
			this.execute(data, 'update')
		}    

		DynamonDB.prototype.delete = function(data){
			this.execute(data, 'delete')
		}

		DynamonDB.prototype.scann = function(model, params){
			// http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/QueryAndScan.html
			return new Promise(function(resolve, reject){

				var scan = new com.amazonaws.mobile.ns.db.NSDBScan(new model().tableName)

				if(params.limit)
					scan.withLimit(params.limit)

				this.db.scan(scan, new com.amazonaws.mobile.ns.db.NSDBCallback({
              
              onSuccess: function(result){


              	var data = {
              		items: [],
              		hasNext: result.getLastEvaluatedKey() != null,
              		lastEvaluatedKey: result.getLastEvaluatedKey(),
              		result: result
              	}

              	if(result){

              		var count = result.getScannedCount()

              		for(var i = 0; i < count; i++){
										var mapAttributeValue = result.getItems().get(i)              			
										var keys = mapAttributeValue.keySet().iterator()


										var entity = new model()
										var attrs = entity.attrs

							      for(var i in attrs){		

							        var attr = attrs[i]

							        if(!attr.dynamon)
							            continue

							        var type = attr.dynamon.type
							        var name = attr.dynamon.name

							        switch(type){
							        	case 'text':
							            entity[attr.name] = mapAttributeValue.get(name).getS()
							            break
							          case 'number':
							            entity[attr.name] = toNumber(mapAttributeValue.get(name).getN())
							            break
							          case 'boolean': 
							            entity[attr.name] = toNumber(mapAttributeValue.get(name).getN()) == 1
							            break
							          case 'date'

							          	var value = mapAttributeValue.get(name).getS()
							          	if(value && value.length > 5)
							          		entity[attr.name] = new Date(value)
							            break
							        }							      
							      }									

							      data.items.push(entity)
              		}

              	}

                console.log('#########################################')
                console.log(`NSDynamoDB.scan success`)
                console.log('#########################################')

                resolve(data)
              },

              onFailure: function(exception){
                  console.log(`NSDynamoDB.scan success with error: ${exception.getMessage()}`)
                  reject(exception.getMessage())
              }

          })


			})

public class NSDBScan {
    protected String expression;
    protected String projection;
    protected Map<String, AttributeValue> expressionAttributeValues;
    protected String tableName;
    protected Integer limit;
    protected Map<String, AttributeValue> lastEvaluatedKey;

    public NSDBScan(String tableName){
        this.tableName = tableName;
        this.expressionAttributeValues = new HashMap<>();
    }

    public NSDBScan withExpression(String expression){
        this.expression = expression;
        return  this;
    }
    public NSDBScan withProjection(String projection){
        this.projection = projection;
        return  this;
    }

    public NSDBScan withExpressionValue(String key, String value){
        AttributeValue attr = new AttributeValue();
        attr.setS(value);
        this.expressionAttributeValues.put(key, attr);
        return  this;
    }

    public NSDBScan withExpressionValue(String key, AttributeValue value){
        this.expressionAttributeValues.put(key, value);
        return  this;
    }

    public NSDBScan withLimit(Integer limit){
        this.limit = limit;
        return  this;
    }

    public NSDBScan withLastEvaluatedKey(Map<String, AttributeValue> lastEvaluatedKey){
        this.lastEvaluatedKey = lastEvaluatedKey;
        return  this;
    }

    public NSDBScan withLastEvaluatedKey(ScanResult result){
        this.lastEvaluatedKey = result.getLastEvaluatedKey();
        return  this;
    }
}
		}

    DynamonDB.prototype.execute = function(data, operation){

      console.log(`DynamonDB.${operation} tableName ${data.tableName}`)
      console.log(`DynamonDB.${operation} data ${JSON.stringify(data)}`)

      return new Promise(function(resolve, reject){

          
          var dbItem = this.createDBItem(data, operation)

          console.log(`DynamonDB.putItem ${dbItem}`)

          var callback = new com.amazonaws.mobile.ns.db.NSDBCallback({
              
              onSuccess: function(result){
                  console.log('#########################################')
                  console.log(`NSDynamoDB.${operation} success`)
                  console.log('#########################################')
                  resolve(result)
              },

              onFailure: function(exception){
                  console.log(`NSDynamoDB.${operation} success with error: ${exception.getMessage()}`)
                  reject(exception.getMessage())
              }

          })

          if(operation == 'create')
          	this.db.putItem(dbItem, callback)
          else if(operation == 'updade')
          	this.db.updateItem(dbItem, callback)
          else if(operation == 'delete')
          	this.db.deleteItem(dbItem, callback)
          else
          	reject(`operation ${operation} not supported`)

      })

    }

    DynamonDB.prototype.createDBItem = function(data, operation){

    	var attrs = data.attrs

    	var dbItem = new com.amazonaws.mobile.ns.db.NSDBItem(data.tableName)

      for(var i in attrs){		

        var attr = attrs[i]

        if(!attr.dynamon)
            continue

        // types http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBMapper.DataTypes.html
        // N S B SS
        var value = data[attr.name]
        var type = attr.dynamon.type
        var name = attr.dynamon.name
        var key = attr.dynamon.key
        var genUUID = attr.dynamon.genUUID

        console.log(`name = ${name}, value = ${value}, key= ${key}`)

        var attrValue
        if(key)
        	attrValue = dbItem.createAtributeValueKey(name)  
        else
        	if(operation == 'update')
        		attrValue = dbItem.createAtributeValueUpdate(name)
        	else if(operation == 'create')
        		attrValue = dbItem.createAtributeValue(name)
        	// else operation == 'delete'

        if(genUUID){
           data[attr.name] = value = java.util.UUID.randomUUID().toString()
        }

        switch(type){
        	case 'text':
            attrValue.setS(value)
            break
          case 'number':
            value = value == null || value == undefined ? 0 : value
            attrValue.setN(value + "")
            break
          case 'boolean': 
            attrValue.setN(value ? 1 : 0)
            break
          case 'date'
            if(value instanceof Date)
                attrValue.setS(value.toISOString())
            else
                attrValue.setS(value)
            break
        }

      }

      return dbItem    	
    }
    function toNumber(text){
    	try{
    		var val = parseInt(text)
    		if(!isNaN(val) && val >= 0 || val <= 0)
    			return val
    		return 0
    	}catch(e){

    	}
    	return 0
    }

    return DynamonDB
})()

module.exports = DynamonDB